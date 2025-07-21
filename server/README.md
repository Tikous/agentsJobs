# Agents & Jobs Backend API

一个基于 NestJS 构建的代理和任务管理系统后端API，支持读写分离的Aurora PostgreSQL数据库。

## 🚀 功能特性

- **代理管理** - 创建、查询、更新和删除代理
- **任务管理** - 创建、查询、更新和删除任务
- **任务分发** - 自动任务分发系统
- **数据库读写分离** - 支持Aurora PostgreSQL读写分离
- **类型安全** - 完整的TypeScript支持
- **数据验证** - 基于class-validator的请求验证
- **ORM支持** - 使用Prisma进行数据库操作

## 📋 系统要求

- Node.js (v18 或更高版本)
- PostgreSQL 数据库 (推荐使用 AWS Aurora)
- npm 或 yarn

## 🛠️ 安装和配置

### 1. 克隆项目并安装依赖

```bash
# 安装依赖
npm install

# 生成 Prisma 客户端
npx prisma generate
```

### 2. 环境配置

创建 `.env` 文件并配置数据库连接：

```bash
# Aurora PostgreSQL 读写分离配置
DATABASE_URL="postgresql://username:password@write-endpoint:5432/database_name?schema=public&sslmode=disable"
DATABASE_WRITE_URL="postgresql://username:password@write-endpoint:5432/database_name?schema=public&sslmode=disable"
DATABASE_READ_URL="postgresql://username:password@read-endpoint:5432/database_name?schema=public&sslmode=disable"

# 服务端口
PORT=3000
```

**注意：** 
- 确保AWS RDS安全组允许您的IP访问5432端口
- 确保RDS实例设置为"公开访问"（开发环境）
- 生产环境建议使用VPN或私有子网连接

### 3. 数据库设置

```bash
# 推送数据库schema（开发环境）
npx prisma db push

# 或运行迁移（生产环境推荐）
npx prisma migrate deploy
```

## 🏃‍♂️ 运行应用

### 开发模式

```bash
npm run start:dev
```

### 生产模式

```bash
# 构建项目
npm run build

# 启动服务
npm run start:prod
```

服务将在 http://localhost:3000 启动

## 📡 API 接口

### 基础接口

- `GET /` - 健康检查

### 代理管理 (Agents)

- `GET /agents` - 获取所有代理
- `GET /agents/:id` - 根据ID获取代理
- `POST /agents` - 创建新代理
- `PATCH /agents/:id` - 更新代理信息
- `DELETE /agents/:id` - 删除代理

### 任务管理 (Jobs)

- `GET /jobs` - 获取所有任务
- `GET /jobs/:id` - 根据ID获取任务
- `POST /jobs` - 创建新任务
- `PATCH /jobs/:id` - 更新任务信息
- `DELETE /jobs/:id` - 删除任务

## 📊 数据库结构

### Agent (代理)
```typescript
{
  id: string;              // UUID主键
  agentName: string;       // 代理名称
  agentAddress: string;    // 代理地址
  description: string;     // 描述
  authorBio: string;       // 作者简介
  agentClassification: string; // 代理分类
  tags: string;           // 标签
  isPrivate: boolean;     // 是否私有
  autoAcceptJobs: boolean; // 自动接受任务
  contractType: string;   // 合约类型
  isActive: boolean;      // 是否激活
  reputation: number;     // 声誉值
  successRate: number;    // 成功率
  totalJobsCompleted: number; // 完成任务数
  walletAddress: string;  // 钱包地址
  createdAt: DateTime;    // 创建时间
  updatedAt: DateTime;    // 更新时间
}
```

### Job (任务)
```typescript
{
  id: string;           // UUID主键
  jobTitle: string;     // 任务标题
  category: string;     // 分类
  description: string;  // 描述
  deliverables: string; // 交付物
  budget: JSON;         // 预算（JSON格式）
  maxBudget: number;    // 最大预算
  deadline: DateTime;   // 截止时间
  paymentType: string;  // 付款类型
  priority: string;     // 优先级
  skillLevel: string;   // 技能等级
  tags: string;         // 标签
  status: string;       // 状态
  autoAssign: boolean;  // 自动分配
  allowBidding: boolean; // 允许竞标
  escrowEnabled: boolean; // 启用托管
  isPublic: boolean;    // 是否公开
  walletAddress: string; // 钱包地址
  createdAt: DateTime;  // 创建时间
  updatedAt: DateTime;  // 更新时间
}
```

## 🔧 开发工具

### Prisma Studio
查看和编辑数据库：

```bash
npx prisma studio
```

将在 http://localhost:5555 打开Prisma Studio

### 代码格式化

```bash
npm run format
```

### 代码检查

```bash
npm run lint
```

## 🧪 测试

```bash
# 单元测试
npm run test

# e2e测试
npm run test:e2e

# 测试覆盖率
npm run test:cov
```

## 🚀 部署

### 使用 PM2 部署

```bash
# 安装 PM2
npm install -g pm2

# 启动应用
pm2 start dist/main.js --name "agents-jobs-api"

# 查看状态
pm2 status

# 查看日志
pm2 logs agents-jobs-api
```

### Docker 部署

```dockerfile
# Dockerfile 示例
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY dist ./dist
COPY prisma ./prisma

EXPOSE 3000

CMD ["node", "dist/main.js"]
```

## 🔒 安全说明

- 生产环境请使用SSL连接数据库 (`sslmode=require`)
- 限制数据库访问IP白名单
- 使用环境变量管理敏感信息
- 定期更新依赖包

## 📝 开发说明

- 项目使用TypeScript开发
- 遵循NestJS最佳实践
- 使用Prisma作为ORM
- 支持读写分离架构
- 包含完整的类型定义和验证

## 🤝 贡献

欢迎提交Issue和Pull Request来改进项目。

## 📄 许可证

本项目采用 UNLICENSED 许可证。