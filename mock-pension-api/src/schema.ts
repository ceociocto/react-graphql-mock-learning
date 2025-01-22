import { makeExecutableSchema } from '@graphql-tools/schema';
import { PubSub } from 'graphql-subscriptions';
import { GraphQLResolveInfo } from 'graphql';

// 类型定义
interface PensionAccount {
  id: string;
  accountNumber: string;
  balance: number;
  ownerName: string;
  status: 'ACTIVE' | 'FROZEN' | 'WITHDRAWN';
  eligibleForWithdrawal: boolean;
  withdrawalHistory: Transaction[];
}

interface Transaction {
  id: string;
  amount: number;
  date: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED';
}

interface PensionRules {
  minimumAge: number;
  maximumWithdrawalPercentage: number;
  taxFreeAmount: number;
}

interface Database {
  accounts: PensionAccount[];
  rules: PensionRules;
}

const pubsub = new PubSub();

// 事件名称常量
const WITHDRAWAL_STATUS_CHANGED = 'WITHDRAWAL_STATUS_CHANGED';
const ACCOUNT_BALANCE_CHANGED = 'ACCOUNT_BALANCE_CHANGED';

// 模拟数据存储
const db: Database = {
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

// 解析器类型
type Context = {
  // 如果需要，可以添加上下文类型
};

type Resolver<TResult, TParent = {}, TArgs = {}> = (
  parent: TParent,
  args: TArgs,
  context: Context,
  info: GraphQLResolveInfo
) => Promise<TResult> | TResult;

// 解析器
const resolvers = {
  Query: {
    pensionAccount: ((_parent, { id }: { id: string }) => 
      db.accounts.find(account => account.id === id)) as Resolver<PensionAccount | undefined, {}, { id: string }>,
    
    allPensionAccounts: (() => db.accounts) as Resolver<PensionAccount[]>,
    
    accountTransactions: ((_parent, { accountId }: { accountId: string }) => {
      const account = db.accounts.find(acc => acc.id === accountId);
      return account ? account.withdrawalHistory : [];
    }) as Resolver<Transaction[], {}, { accountId: string }>,
    
    pensionRules: (() => db.rules) as Resolver<PensionRules>
  },

  Mutation: {
    requestWithdrawal: (async (_parent, { accountId, amount }: { accountId: string, amount: number }) => {
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

      const maxAmount = account.balance * (db.rules.maximumWithdrawalPercentage / 100);
      if (amount > maxAmount) {
        return {
          success: false,
          message: `提取金额不能超过账户余额的${db.rules.maximumWithdrawalPercentage}%`,
          transaction: null
        };
      }

      const transaction: Transaction = {
        id: `TXN${Math.random().toString(36).substr(2, 6)}`,
        amount,
        date: new Date().toISOString(),
        status: 'PENDING'
      };

      account.withdrawalHistory.push(transaction);
      account.balance -= amount;

      await pubsub.publish(WITHDRAWAL_STATUS_CHANGED, {
        withdrawalStatusChanged: transaction,
        accountId
      });

      await pubsub.publish(ACCOUNT_BALANCE_CHANGED, {
        accountBalanceChanged: account,
        accountId
      });

      return {
        success: true,
        message: '提取申请已提交',
        transaction
      };
    }) as Resolver<{ success: boolean; message: string; transaction: Transaction | null }, {}, { accountId: string; amount: number }>,

    updateAccountStatus: ((_parent, { accountId, status }: { accountId: string, status: PensionAccount['status'] }) => {
      const account = db.accounts.find(acc => acc.id === accountId);
      if (!account) {
        throw new Error('账户未找到');
      }

      account.status = status;
      return account;
    }) as Resolver<PensionAccount, {}, { accountId: string; status: PensionAccount['status'] }>
  },

  Subscription: {
    withdrawalStatusChanged: {
      subscribe: ((_parent, { accountId }: { accountId: string }) => {
        return pubsub.asyncIterator([WITHDRAWAL_STATUS_CHANGED]);
      }) as Resolver<AsyncIterator<unknown>, {}, { accountId: string }>,
      resolve: ((payload: { withdrawalStatusChanged: Transaction }) => {
        return payload.withdrawalStatusChanged;
      }) as Resolver<Transaction, { withdrawalStatusChanged: Transaction }>
    },

    accountBalanceChanged: {
      subscribe: ((_parent, { accountId }: { accountId: string }) => {
        return pubsub.asyncIterator([ACCOUNT_BALANCE_CHANGED]);
      }) as Resolver<AsyncIterator<unknown>, {}, { accountId: string }>,
      resolve: ((payload: { accountBalanceChanged: PensionAccount }) => {
        return payload.accountBalanceChanged;
      }) as Resolver<PensionAccount, { accountBalanceChanged: PensionAccount }>
    }
  }
};

export const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
}); 