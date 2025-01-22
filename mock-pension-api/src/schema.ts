import { makeExecutableSchema } from '@graphql-tools/schema';
import { PubSub } from 'graphql-subscriptions';

const pubsub = new PubSub();

// 事件名称常量
const WITHDRAWAL_STATUS_CHANGED = 'WITHDRAWAL_STATUS_CHANGED';
const ACCOUNT_BALANCE_CHANGED = 'ACCOUNT_BALANCE_CHANGED';

// 模拟数据存储
const db = {
  accounts: [
    {
      id: '1',
      accountNumber: 'PENS001',
      balance: 50000.00,
      ownerName: '张三',
      status: 'ACTIVE',
      eligibleForWithdrawal: true,
      withdrawalHistory: [
        {
          id: 'TXN001',
          amount: 5000.00,
          date: '2024-01-15T10:00:00Z',
          status: 'COMPLETED'
        }
      ]
    },
    {
      id: '2',
      accountNumber: 'PENS002',
      balance: 75000.00,
      ownerName: '李四',
      status: 'ACTIVE',
      eligibleForWithdrawal: false,
      withdrawalHistory: []
    }
  ],
  
  // 养老金提取规则
  rules: {
    minimumAge: 55,
    maximumWithdrawalPercentage: 25,
    taxFreeAmount: 25000
  }
};

// GraphQL Schema 定义
const typeDefs = `
  type PensionAccount {
    id: ID!
    accountNumber: String!
    balance: Float!
    ownerName: String!
    status: PensionStatus!
    eligibleForWithdrawal: Boolean!
    withdrawalHistory: [Transaction!]!
  }

  enum PensionStatus {
    ACTIVE    # 正常状态
    FROZEN    # 冻结状态
    WITHDRAWN # 已提取完毕
  }

  type Transaction {
    id: ID!
    amount: Float!
    date: String!
    status: TransactionStatus!
  }

  enum TransactionStatus {
    PENDING   # 等待处理
    APPROVED  # 已批准
    REJECTED  # 已拒绝
    COMPLETED # 已完成
  }

  type WithdrawalResult {
    success: Boolean!
    message: String
    transaction: Transaction
  }

  type PensionRules {
    minimumAge: Int!
    maximumWithdrawalPercentage: Float!
    taxFreeAmount: Float!
  }

  type Query {
    # 查询单个账户
    pensionAccount(id: ID!): PensionAccount
    
    # 查询所有账户
    allPensionAccounts: [PensionAccount!]!
    
    # 查询账户交易历史
    accountTransactions(accountId: ID!): [Transaction!]!
    
    # 查询养老金规则
    pensionRules: PensionRules!
  }

  type Mutation {
    # 申请提取养老金
    requestWithdrawal(
      accountId: ID!, 
      amount: Float!
    ): WithdrawalResult!
    
    # 更新账户状态
    updateAccountStatus(
      accountId: ID!, 
      status: PensionStatus!
    ): PensionAccount!
  }

  type Subscription {
    # 监听交易状态变化
    withdrawalStatusChanged(accountId: ID!): Transaction!
    # 监听账户余额变化
    accountBalanceChanged(accountId: ID!): PensionAccount!
  }
`;

// 解析器
const resolvers = {
  Query: {
    pensionAccount: (_: any, { id }: { id: string }) => 
      db.accounts.find(account => account.id === id),
    
    allPensionAccounts: () => db.accounts,
    
    accountTransactions: (_: any, { accountId }: { accountId: string }) => {
      const account = db.accounts.find(acc => acc.id === accountId);
      return account ? account.withdrawalHistory : [];
    },
    
    pensionRules: () => db.rules
  },

  Mutation: {
    requestWithdrawal: async (_: any, { accountId, amount }: { accountId: string, amount: number }) => {
      const account = db.accounts.find(acc => acc.id === accountId);
      
      if (!account) {
        return {
          success: false,
          message: '账户未找到',
          transaction: null
        };
      }

      if (!account.eligibleForWithdrawal) {
        return {
          success: false,
          message: '账户不符合提取条件',
          transaction: null
        };
      }

      if (amount > account.balance) {
        return {
          success: false,
          message: '余额不足',
          transaction: null
        };
      }

      // 检查提取金额是否超过最大允许比例
      const maxAmount = account.balance * (db.rules.maximumWithdrawalPercentage / 100);
      if (amount > maxAmount) {
        return {
          success: false,
          message: `提取金额不能超过账户余额的${db.rules.maximumWithdrawalPercentage}%`,
          transaction: null
        };
      }

      const transaction = {
        id: `TXN${Math.random().toString(36).substr(2, 6)}`,
        amount,
        date: new Date().toISOString(),
        status: 'PENDING'
      };

      account.withdrawalHistory.push(transaction);
      account.balance -= amount;

      // 发布交易状态变更事件
      await pubsub.publish(WITHDRAWAL_STATUS_CHANGED, {
        withdrawalStatusChanged: transaction,
        accountId
      });

      // 发布账户余额变更事件
      await pubsub.publish(ACCOUNT_BALANCE_CHANGED, {
        accountBalanceChanged: account,
        accountId
      });

      return {
        success: true,
        message: '提取申请已提交',
        transaction
      };
    },

    updateAccountStatus: (_: any, { accountId, status }: { accountId: string, status: string }) => {
      const account = db.accounts.find(acc => acc.id === accountId);
      if (!account) {
        throw new Error('账户未找到');
      }

      account.status = status;
      return account;
    }
  },

  Subscription: {
    withdrawalStatusChanged: {
      subscribe: (_: any, { accountId }: { accountId: string }) => {
        return pubsub.asyncIterator([WITHDRAWAL_STATUS_CHANGED]);
      },
      resolve: (payload: any) => {
        return payload.withdrawalStatusChanged;
      }
    },

    accountBalanceChanged: {
      subscribe: (_: any, { accountId }: { accountId: string }) => {
        return pubsub.asyncIterator([ACCOUNT_BALANCE_CHANGED]);
      },
      resolve: (payload: any) => {
        return payload.accountBalanceChanged;
      }
    }
  }
};

export const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
}); 