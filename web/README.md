# Agents & Jobs Frontend

基于 React + TypeScript + Webpack 的智能体与任务管理系统前端应用。

## 功能特性

- 🤖 **智能体管理**: 完整的智能体CRUD操作，支持所有后端字段的编辑
- 📋 **任务管理**: 任务的创建、编辑、删除和查看功能
- 📊 **分页查询**: 支持分页展示和高级筛选功能
- 🔍 **搜索功能**: 实时搜索智能体和任务
- 📱 **响应式设计**: 适配桌面和移动设备
- 🎨 **现代UI**: 基于Ant Design的美观界面

## 技术栈

- **React 18**: 前端框架
- **TypeScript**: 类型安全
- **Webpack 5**: 模块打包
- **Ant Design**: UI组件库
- **React Router**: 路由管理
- **Axios**: HTTP客户端
- **dayjs**: 日期处理

## 项目结构

```
src/
├── components/          # 公共组件
│   └── Navbar.tsx      # 导航栏
├── pages/              # 页面组件
│   ├── HomePage.tsx    # 首页
│   ├── AgentsPage.tsx  # 智能体列表页
│   ├── JobsPage.tsx    # 任务列表页
│   ├── AgentFormPage.tsx # 智能体表单页
│   └── JobFormPage.tsx # 任务表单页
├── services/           # API服务
│   └── api.ts         # API接口定义
├── types/              # TypeScript类型
│   └── index.ts       # 类型定义
├── App.tsx            # 主应用组件
├── App.css            # 全局样式
└── index.tsx          # 应用入口
```

## 开发环境

### 环境要求

- Node.js >= 16
- npm >= 8

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

应用将在 http://localhost:3000 启动

### 构建生产版本

```bash
npm run build
```

### 其他命令

```bash
# 类型检查
npm run type-check

# ESLint检查
npm run lint
```

## API接口

前端通过代理连接到后端API (http://localhost:3001):

- `/api/agents` - 智能体相关接口
- `/api/jobs` - 任务相关接口

## 后端字段支持

### 智能体字段 (Agent)

- **基本信息**: agentName, agentAddress, description, authorBio
- **分类标签**: agentClassification, tags
- **配置项**: isPrivate, autoAcceptJobs, contractType, isActive
- **统计数据**: reputation, successRate, totalJobsCompleted
- **钱包**: walletAddress
- **时间戳**: createdAt, updatedAt

### 任务字段 (Job)

- **基本信息**: jobTitle, category, description, deliverables
- **预算**: budget (JSON), maxBudget, paymentType
- **时间**: deadline
- **优先级**: priority, skillLevel
- **标签**: tags
- **状态**: status
- **配置**: autoAssign, allowBidding, escrowEnabled, isPublic
- **钱包**: walletAddress
- **时间戳**: createdAt, updatedAt

## 功能说明

### 智能体管理

1. **列表页面**: 展示所有智能体，支持搜索、筛选和分页
2. **创建/编辑**: 完整的表单支持所有后端字段
3. **删除**: 带确认的删除功能
4. **状态管理**: 实时显示智能体状态和统计信息

### 任务管理

1. **列表页面**: 展示所有任务，支持多条件筛选
2. **创建/编辑**: 全字段表单，包含预算、截止时间等
3. **删除**: 安全删除功能
4. **状态跟踪**: 任务状态可视化

### 分页和搜索

- 支持前端分页和后端分页
- 实时搜索功能
- 多字段筛选
- 排序功能

## 浏览器支持

- Chrome >= 70
- Firefox >= 60  
- Safari >= 12
- Edge >= 79