import { makeExecutableSchema } from '@graphql-tools/schema';
import { PubSub } from 'graphql-subscriptions';
import { GraphQLResolveInfo } from 'graphql';
import { createBeneficiaryLoader, createTransactionLoader, createAccountLoader } from './loaders';

// 类型定义
interface BeneficiaryInfo {
  id: string;
  name: string;
  relationship: string;
  percentage: number;
  contactNumber: string;
}

interface PensionAccount {
  id: string;
  accountNumber: string;
  balance: number;
  ownerName: string;
  status: 'ACTIVE' | 'FROZEN' | 'WITHDRAWN';
  eligibleForWithdrawal: boolean;
  withdrawalHistory: Transaction[];
  beneficiaries: BeneficiaryInfo[];  // 新增受益人字段
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
      ],
      beneficiaries: [
        {
          id: 'BEN001',
          name: '张小明',
          relationship: '子女',
          percentage: 60,
          contactNumber: '13800138001'
        },
        {
          id: 'BEN002',
          name: '李娟',
          relationship: '配偶',
          percentage: 40,
          contactNumber: '13800138002'
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
      withdrawalHistory: [],
      beneficiaries: [
        {
          id: 'BEN003',
          name: '李明',
          relationship: '子女',
          percentage: 100,
          contactNumber: '13800138003'
        }
      ]
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
  type BeneficiaryInfo {
    id: ID!
    name: String!
    relationship: String!
    percentage: Float!
    contactNumber: String!
  }

  type PensionAccount {
    id: ID!
    accountNumber: String!
    balance: Float!
    ownerName: String!
    status: PensionStatus!
    eligibleForWithdrawal: Boolean!
    withdrawalHistory: [Transaction!]!
    beneficiaries: [BeneficiaryInfo!]!
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

  type PageInfo {
    hasNextPage: Boolean!
    hasPreviousPage: Boolean!
    startCursor: String
    endCursor: String
  }

  type PensionAccountEdge {
    cursor: String!
    node: PensionAccount!
  }

  type PensionAccountConnection {
    edges: [PensionAccountEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type TransactionEdge {
    cursor: String!
    node: Transaction!
  }

  type TransactionConnection {
    edges: [TransactionEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
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
    
    # 查询账户受益人信息
    accountBeneficiaries(accountId: ID!): [BeneficiaryInfo!]!
    
    # 批量查询多个账户
    pensionAccounts(ids: [ID!]!): [PensionAccount]!

    # 分页查询账户列表
    paginatedAccounts(
      first: Int
      after: String
      last: Int
      before: String
    ): PensionAccountConnection!

    # 分页查询交易历史
    paginatedTransactions(
      accountId: ID!
      first: Int
      after: String
      last: Int
      before: String
    ): TransactionConnection!
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
    
    # 添加受益人
    addBeneficiary(
      accountId: ID!
      name: String!
      relationship: String!
      percentage: Float!
      contactNumber: String!
    ): BeneficiaryInfo!
  }

  type Subscription {
    # 监听交易状态变化
    withdrawalStatusChanged(accountId: ID!): Transaction!
    # 监听账户余额变化
    accountBalanceChanged(accountId: ID!): PensionAccount!
  }
`;

// 解析器类型
interface Context {
  loaders: {
    beneficiaryLoader: ReturnType<typeof createBeneficiaryLoader>;
    transactionLoader: ReturnType<typeof createTransactionLoader>;
    accountLoader: ReturnType<typeof createAccountLoader>;
  };
}

type Resolver<TResult, TParent = {}, TArgs = {}> = (
  parent: TParent,
  args: TArgs,
  context: Context,
  info: GraphQLResolveInfo
) => Promise<TResult> | TResult;

// 解析器
const resolvers = {
  Query: {
    pensionAccount: (async (_parent, { id }, { loaders }) => {
      return await loaders.accountLoader.load(id);
    }) as Resolver<PensionAccount | undefined, {}, { id: string }>,
    
    allPensionAccounts: (() => db.accounts) as Resolver<PensionAccount[]>,
    
    accountTransactions: (async (_parent, { accountId }, { loaders }) => {
      return await loaders.transactionLoader.load(accountId);
    }) as Resolver<Transaction[], {}, { accountId: string }>,
    
    pensionRules: (() => db.rules) as Resolver<PensionRules>,
    
    accountBeneficiaries: (async (_parent, { accountId }, { loaders }) => {
      return await loaders.beneficiaryLoader.load(accountId);
    }) as Resolver<BeneficiaryInfo[], {}, { accountId: string }>,
    
    pensionAccounts: (async (_parent, { ids }, { loaders }) => {
      return await loaders.accountLoader.loadMany(ids);
    }) as Resolver<PensionAccount[], {}, { ids: string[] }>,

    paginatedAccounts: (async (_parent, args) => {
      const { first = 10, after, last, before } = args;
      let accounts = [...db.accounts];
      
      // 实现基于游标的分页
      let hasNextPage = false;
      let hasPreviousPage = false;
      
      if (after) {
        const index = accounts.findIndex(acc => Buffer.from(acc.id).toString('base64') === after);
        accounts = accounts.slice(index + 1);
        hasPreviousPage = true;
      }
      
      if (before) {
        const index = accounts.findIndex(acc => Buffer.from(acc.id).toString('base64') === before);
        accounts = accounts.slice(0, index);
      }
      
      if (first) {
        hasNextPage = accounts.length > first;
        accounts = accounts.slice(0, first);
      }
      
      if (last) {
        hasPreviousPage = true;
        accounts = accounts.slice(-last);
      }

      const edges = accounts.map(account => ({
        cursor: Buffer.from(account.id).toString('base64'),
        node: account
      }));

      return {
        edges,
        pageInfo: {
          hasNextPage,
          hasPreviousPage,
          startCursor: edges[0]?.cursor,
          endCursor: edges[edges.length - 1]?.cursor
        },
        totalCount: db.accounts.length
      };
    }) as Resolver<any, {}, { first?: number; after?: string; last?: number; before?: string }>,

    paginatedTransactions: (async (_parent, args) => {
      const { accountId, first = 10, after, last, before } = args;
      const account = db.accounts.find(acc => acc.id === accountId);
      if (!account) return null;

      let transactions = [...account.withdrawalHistory];
      
      let hasNextPage = false;
      let hasPreviousPage = false;
      
      if (after) {
        const index = transactions.findIndex(tx => Buffer.from(tx.id).toString('base64') === after);
        transactions = transactions.slice(index + 1);
        hasPreviousPage = true;
      }
      
      if (before) {
        const index = transactions.findIndex(tx => Buffer.from(tx.id).toString('base64') === before);
        transactions = transactions.slice(0, index);
      }
      
      if (first) {
        hasNextPage = transactions.length > first;
        transactions = transactions.slice(0, first);
      }
      
      if (last) {
        hasPreviousPage = true;
        transactions = transactions.slice(-last);
      }

      const edges = transactions.map(tx => ({
        cursor: Buffer.from(tx.id).toString('base64'),
        node: tx
      }));

      return {
        edges,
        pageInfo: {
          hasNextPage,
          hasPreviousPage,
          startCursor: edges[0]?.cursor,
          endCursor: edges[edges.length - 1]?.cursor
        },
        totalCount: account.withdrawalHistory.length
      };
    }) as Resolver<any, {}, { accountId: string; first?: number; after?: string; last?: number; before?: string }>
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
    }) as Resolver<PensionAccount, {}, { accountId: string; status: PensionAccount['status'] }>,

    addBeneficiary: ((_parent, { accountId, name, relationship, percentage, contactNumber }) => {
      const account = db.accounts.find(acc => acc.id === accountId);
      if (!account) {
        throw new Error('账户未找到');
      }

      // 检查受益人分配比例总和是否超过100%
      const currentTotal = account.beneficiaries.reduce((sum, ben) => sum + ben.percentage, 0);
      if (currentTotal + percentage > 100) {
        throw new Error('受益人分配比例总和不能超过100%');
      }

      const beneficiary: BeneficiaryInfo = {
        id: `BEN${Math.random().toString(36).substr(2, 6)}`,
        name,
        relationship,
        percentage,
        contactNumber
      };

      account.beneficiaries.push(beneficiary);
      return beneficiary;
    }) as Resolver<
      BeneficiaryInfo,
      {},
      {
        accountId: string;
        name: string;
        relationship: string;
        percentage: number;
        contactNumber: string;
      }
    >
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
  },

  PensionAccount: {
    beneficiaries: (async (parent, _args, { loaders }) => {
      return await loaders.beneficiaryLoader.load(parent.id);
    }) as Resolver<BeneficiaryInfo[]>,
    
    withdrawalHistory: (async (parent, _args, { loaders }) => {
      return await loaders.transactionLoader.load(parent.id);
    }) as Resolver<Transaction[]>
  }
};

export const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
}); 