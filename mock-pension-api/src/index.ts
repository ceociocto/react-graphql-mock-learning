import { createYoga } from 'graphql-yoga';
import { createServer } from 'node:http';
import { schema } from './schema';

// 创建 GraphQL Yoga 实例
const yoga = createYoga({
  schema,
  cors: {
    origin: ['http://localhost:5173'],
    credentials: true
  }
});

// 创建HTTP服务器
const server = createServer(yoga);

// 启动服务器
const port = 4000;
server.listen(port, () => {
  console.log(`
🚀 GraphQL服务器已启动！

📝 GraphQL Playground: http://localhost:${port}/graphql
   在这里你可以测试查询和修改操作

💡 提示：
   1. 尝试查询所有账户: { allPensionAccounts { id ownerName balance } }
   2. 查看养老金规则: { pensionRules { minimumAge maximumWithdrawalPercentage } }
   3. 测试提取功能: mutation { requestWithdrawal(accountId: "1", amount: 1000) { success message } }
  `);
}); 