# GraphQL 学习指南 - 养老金系统实战

## 项目概述

这是一个使用GraphQL构建的养老金管理系统，通过实际案例学习GraphQL的核心概念和最佳实践。

### 技术栈

- 前端：React + Apollo Client + TypeScript
- 后端：GraphQL Yoga + GraphQL Tools
- 开发工具：Vite, pnpm

## 核心概念讲解

### 1. Schema 定义和类型系统

GraphQL使用强类型系统来定义API的数据结构。

```graphql
# 基本类型示例
type PensionAccount {
  id: ID!                    # ID类型，必填(!)
  accountNumber: String!     # 字符串类型，必填
  balance: Float!           # 浮点数类型，必填
  eligibleForWithdrawal: Boolean! # 布尔类型，必填
}

# 枚举类型示例
enum PensionStatus {
  ACTIVE    # 正常状态
  FROZEN    # 冻结状态
  WITHDRAWN # 已提取完毕
}

# 列表类型示例
type PensionAccount {
  withdrawalHistory: [Transaction!]! # Transaction数组，数组和元素都不能为null
}
```

### 2. 查询（Query）操作

#### Schema定义
```graphql
type Query {
  pensionAccount(id: ID!): PensionAccount    # 带参数的查询
  allPensionAccounts: [PensionAccount!]!     # 列表查询
  pensionRules: PensionRules!                # 简单查询
}
```

#### 前端实现
```typescript
// 使用 useQuery Hook 获取数据
const { loading, error, data } = useQuery(GET_ALL_PENSION_ACCOUNTS);

// 查询定义
export const GET_ALL_PENSION_ACCOUNTS = gql`
  query GetAllPensionAccounts {
    allPensionAccounts {
      id
      accountNumber
      balance
      ownerName
      status
      eligibleForWithdrawal
    }
  }
`;
```

### 3. 变更（Mutation）操作

#### Schema定义
```graphql
type Mutation {
  requestWithdrawal(
    accountId: ID!, 
    amount: Float!
  ): WithdrawalResult!
}

type WithdrawalResult {
  success: Boolean!
  message: String
  transaction: Transaction
}
```

#### 前端实现
```typescript
// 使用 useMutation Hook 执行变更
const [requestWithdrawal, { loading }] = useMutation(REQUEST_WITHDRAWAL, {
  refetchQueries: [{ query: GET_ALL_PENSION_ACCOUNTS }], // 更新缓存
  onCompleted: (data) => {
    if (data.requestWithdrawal.success) {
      onClose();
    } else {
      setError(data.requestWithdrawal.message);
    }
  }
});

// 调用变更操作
requestWithdrawal({
  variables: {
    accountId,
    amount: withdrawalAmount
  }
});
```

### 4. Apollo Client 集成

```typescript
// Apollo Client 配置
export const client = new ApolloClient({
  uri: 'http://localhost:4000/graphql', // GraphQL服务器地址
  cache: new InMemoryCache(),           // 客户端缓存
  credentials: 'include'                // 跨域认证设置
});
```

### 5. 错误处理和加载状态

```typescript
// 组件中的加载和错误处理
if (loading) return (
  <div className="loading-container">
    <div className="loading-spinner"></div>
    <p>加载账户信息...</p>
  </div>
);

if (error) return (
  <div className="error-container">
    <h3>出错了！</h3>
    <p>{error.message}</p>
  </div>
);
```

### 6. 业务规则验证

#### 后端验证
```typescript
// 解析器中的业务规则验证
if (amount > account.balance) {
  return {
    success: false,
    message: '余额不足',
    transaction: null
  };
}
```

#### 前端验证
```typescript
// 前端表单验证
const rules = rulesData?.pensionRules;
if (rules) {
  const maxAmount = balance * (rules.maximumWithdrawalPercentage / 100);
  if (withdrawalAmount > maxAmount) {
    setError(`提取金额不能超过账户余额的${rules.maximumWithdrawalPercentage}%`);
    return;
  }
}
```

## GraphQL的优势

1. **强类型系统**
   - 在开发时就能发现类型错误
   - 提供良好的IDE支持和自动完成
   - 自动生成文档

2. **按需获取数据**
   - 客户端指定需要的字段
   - 避免过度获取（over-fetching）
   - 减少网络传输

3. **单一端点**
   - 所有操作通过一个端点完成
   - 简化API版本管理
   - 降低维护成本

4. **实时开发工具**
   - GraphQL Playground提供交互式文档
   - 可以直接测试查询和变更
   - 自动补全和语法验证

5. **优秀的错误处理**
   - 详细的错误信息
   - 部分查询失败不影响整体
   - 类型安全的错误处理

## 进阶主题

### 待实现功能

1. **实时更新（Subscriptions）**
   - 交易状态实时通知
   - 账户余额实时更新

2. **数据关系和批量查询优化**
   - DataLoader实现
   - 查询合并
   - 缓存策略

3. **认证和授权**
   - JWT集成
   - 角色基础访问控制
   - 字段级权限

4. **性能优化**
   - 查询复杂度分析
   - 缓存策略优化
   - N+1问题解决

### 最佳实践

1. **Schema设计**
   - 类型优先设计
   - 清晰的命名约定
   - 合理的字段粒度

2. **错误处理**
   - 统一的错误格式
   - 合适的错误粒度
   - 友好的错误信息

3. **安全性**
   - 查询深度限制
   - 速率限制
   - 输入验证

4. **测试**
   - Schema测试
   - 解析器测试
   - 集成测试

## 进阶主题实现

### 1. 实时更新（Subscriptions）

GraphQL Subscriptions 允许服务器向客户端推送数据，实现实时更新功能。

#### Schema定义
```graphql
type Subscription {
  # 监听交易状态变化
  withdrawalStatusChanged(accountId: ID!): Transaction!
  # 监听账户余额变化
  accountBalanceChanged(accountId: ID!): PensionAccount!
}
```

#### 后端实现
```typescript
import { PubSub } from 'graphql-subscriptions';

const pubsub = new PubSub();

const resolvers = {
  Subscription: {
    withdrawalStatusChanged: {
      subscribe: (_: any, { accountId }: { accountId: string }) => {
        return pubsub.asyncIterator([WITHDRAWAL_STATUS_CHANGED]);
      },
      resolve: (payload: any) => {
        return payload.withdrawalStatusChanged;
      }
    }
  },
  
  Mutation: {
    requestWithdrawal: async (_: any, { accountId, amount }) => {
      // ... 处理逻辑 ...
      
      // 发布事件
      await pubsub.publish(WITHDRAWAL_STATUS_CHANGED, {
        withdrawalStatusChanged: transaction,
        accountId
      });
      
      return { success: true, transaction };
    }
  }
};
```

#### 前端配置
```typescript
// Apollo Client WebSocket配置
const wsLink = new GraphQLWsLink(createClient({
  url: 'ws://localhost:4000/graphql',
}));

// 根据操作类型分割请求
const splitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return (
      definition.kind === 'OperationDefinition' &&
      definition.operation === 'subscription'
    );
  },
  wsLink,
  httpLink
);
```

#### 前端使用
```typescript
// 订阅定义
const WITHDRAWAL_STATUS_SUBSCRIPTION = gql`
  subscription OnWithdrawalStatusChanged($accountId: ID!) {
    withdrawalStatusChanged(accountId: $accountId) {
      id
      amount
      date
      status
    }
  }
`;

// 在组件中使用
const { data, loading } = useSubscription(
  WITHDRAWAL_STATUS_SUBSCRIPTION,
  {
    variables: { accountId }
  }
);
```

#### 实现要点

1. **WebSocket通信**
   - 使用WebSocket保持持久连接
   - 支持服务器推送数据
   - 实现实时更新

2. **发布/订阅模式**
   - 使用PubSub管理事件
   - 支持多客户端订阅
   - 按需发布更新

3. **状态同步**
   - 实时更新UI
   - 保持数据一致性
   - 处理错误和重连

4. **性能考虑**
   - 合理使用WebSocket资源
   - 控制订阅数量
   - 及时清理无用订阅

## 学习资源

1. [GraphQL官方文档](https://graphql.org/learn/)
2. [Apollo Client文档](https://www.apollographql.com/docs/react/)
3. [GraphQL Tools文档](https://the-guild.dev/graphql/tools) 