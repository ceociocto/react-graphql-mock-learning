# React GraphQL 养老金系统示例

这是一个使用 React 和 GraphQL 构建的养老金系统示例项目，用于学习和演示 GraphQL 的核心概念和最佳实践。

## 项目结构

```
.
├── mock-pension-api/     # GraphQL 后端服务
│   ├── src/
│   │   ├── schema.ts    # GraphQL Schema 定义
│   │   └── index.ts     # 服务器入口
│   └── package.json
│
└── pension-portal/       # React 前端应用
    ├── src/
    │   ├── components/  # React 组件
    │   ├── graphql/     # GraphQL 查询和变更
    │   └── types/       # TypeScript 类型定义
    └── package.json
```

## 技术栈

- **前端**
  - React
  - Apollo Client
  - TypeScript
  - Vite

- **后端**
  - GraphQL Yoga
  - TypeScript
  - GraphQL Subscriptions

## 功能特性

- 账户信息查询
- 交易历史记录
- 提取申请处理
- 实时状态更新
- 业务规则验证

## 开发指南

1. 安装依赖
```bash
# 安装后端依赖
cd mock-pension-api
pnpm install

# 安装前端依赖
cd ../pension-portal
pnpm install
```

2. 启动开发服务器
```bash
# 启动后端服务
cd mock-pension-api
pnpm dev

# 启动前端服务
cd ../pension-portal
pnpm dev
```

## GraphQL 学习要点

详细的学习指南请参考 [docs/graphql-learning-guide.md](docs/graphql-learning-guide.md)

## 许可证

MIT 