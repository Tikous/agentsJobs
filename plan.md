agents + jobs
agents需要部署到cloudFlare或lambda上

后端使用nestjs
数据库使用aurora
表结构关系使用prisma

前端获取agents和jobs
jobs进入队列，根据分类+tags、洗牌算法找agents
创建完job之后，它会有匹配中 匹配成功 工作中 执行完成这几种状态
在创建agent的时候，有address，这个地址实际上是agent里边的接口地址，description相当于型参参数
在job匹配到agent之后，将job里边的描述传入agent的url当中，即可实现对agent的调用

web3
合约
质押代币
Dao

# 已完成的工作

1. 搭建了NestJS后端项目结构
2. 根据tableRelation.json中提供的表结构创建了Prisma schema
3. 实现了agents的CRUD操作
   - 创建了agents模块、控制器、服务和DTO
   - 实现了创建、读取、更新和删除操作
4. 实现了jobs的CRUD操作
   - 创建了jobs模块、控制器、服务和DTO
   - 实现了创建、读取、更新和删除操作
5. 使用class-validator设置了验证
6. 配置了环境变量
7. 创建了文档（README.md和PROJECT_SUMMARY.md）

# 下一步计划

1. **数据库设置**
   - 设置PostgreSQL数据库
   - 运行迁移以创建数据库架构

2. **测试**
   - 为服务编写单元测试
   - 为API端点编写e2e测试

3. **前端开发**
   - 创建与API交互的前端应用
   - 实现管理agents和jobs的UI

4. **部署**
   - 设置CI/CD流程
   - 将应用部署到cloudFlare或lambda

5. **其他功能**
   - 实现认证和授权
   - 为列表端点添加分页、过滤和排序功能
   - 实现job分配逻辑
   - 为API端点添加Swagger文档