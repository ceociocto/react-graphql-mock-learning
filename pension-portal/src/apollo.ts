import { ApolloClient, InMemoryCache, split, HttpLink, from } from '@apollo/client';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { getMainDefinition } from '@apollo/client/utilities';
import { createClient } from 'graphql-ws';
import { persistCache, LocalStorageWrapper } from 'apollo3-cache-persist';
import { performanceLink } from './apollo/links/performance';

// 创建 HTTP 链接
const httpLink = new HttpLink({
  uri: 'http://localhost:4000/graphql',
  credentials: 'include'
});

// 创建 WebSocket 链接
const wsLink = new GraphQLWsLink(
  createClient({
    url: 'ws://localhost:4000/graphql'
  })
);

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

// 配置缓存
const cache = new InMemoryCache({
  typePolicies: {
    Query: {
      fields: {
        // 分页账户列表的缓存策略
        paginatedAccounts: {
          // 合并函数，用于处理分页数据
          merge(existing, incoming, { args }) {
            if (!args) return incoming;
            
            // 如果是第一页或重新加载，直接返回新数据
            if (!args.after && !args.before) {
              return incoming;
            }

            // 合并现有数据和新数据
            const existingEdges = existing?.edges || [];
            const incomingEdges = incoming.edges;

            return {
              ...incoming,
              edges: [...existingEdges, ...incomingEdges]
            };
          },
          
          // 读取函数，用于处理缓存命中
          read(existing) {
            return existing;
          }
        },
        
        // 账户信息的缓存策略
        pensionAccount: {
          // 使用 id 作为缓存键
          keyArgs: ['id'],
          // 合并函数，用于处理账户数据更新
          merge(existing, incoming) {
            return { ...existing, ...incoming };
          }
        }
      }
    },
    PensionAccount: {
      fields: {
        // 受益人列表的缓存策略
        beneficiaries: {
          merge(existing = [], incoming) {
            return incoming;
          }
        },
        // 交易历史的缓存策略
        withdrawalHistory: {
          merge(existing = [], incoming) {
            return incoming;
          }
        }
      }
    }
  }
});

// 初始化 Apollo Client
let client: ApolloClient<any>;

// 异步初始化函数
export async function initializeApollo() {
  // 配置缓存持久化
  await persistCache({
    cache,
    storage: new LocalStorageWrapper(window.localStorage),
    debug: true, // 开发环境启用调试
    trigger: 'write', // 写入时触发持久化
  });

  // 创建 Apollo Client 实例，添加性能监控链接
  client = new ApolloClient({
    link: from([performanceLink, splitLink]),
    cache,
    defaultOptions: {
      watchQuery: {
        fetchPolicy: 'cache-first',
        nextFetchPolicy: 'cache-first',
        pollInterval: 0
      },
      query: {
        fetchPolicy: 'cache-first'
      },
      mutation: {
        fetchPolicy: 'network-only'
      }
    }
  });

  return client;
}

// 获取 Apollo Client 实例
export function getApolloClient() {
  return client;
}
