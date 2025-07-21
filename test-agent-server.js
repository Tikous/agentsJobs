const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// 模拟Agent API端点
app.post('/api/agents/testAgent/generate', (req, res) => {
  console.log('收到任务请求:', req.body);
  
  const { messages } = req.body;
  const userMessage = messages?.[0]?.content || '没有提供任务内容';
  
  // 模拟处理时间
  setTimeout(() => {
    const response = {
      text: `# 任务执行完成 ✅

## 任务概述
我已经收到并处理了以下任务：

\`\`\`
${userMessage}
\`\`\`

## 执行结果

### 1. 任务分析
- 已成功解析任务需求
- 识别关键要素和目标
- 评估资源需求和约束条件

### 2. 执行过程
1. **初始化处理** - 准备执行环境
2. **核心逻辑执行** - 按照任务要求进行处理
3. **结果验证** - 确保输出符合预期

### 3. 输出结果
- ✅ 任务状态：**已完成**
- ⏱️ 处理时间：约 ${Math.floor(Math.random() * 5) + 1} 秒
- 📊 成功率：100%

## 详细说明

根据任务要求，我执行了以下操作：

- 数据处理和分析
- 业务逻辑实现
- 质量检查和验证

## 附加信息

> 💡 **提示**: 此结果由测试Agent生成，用于演示系统功能。

**生成时间**: ${new Date().toLocaleString()}
**Agent版本**: v1.0.0-test
**执行环境**: Node.js Test Server

---

*如有疑问，请联系系统管理员。*`
    };
    
    res.json(response);
  }, 2000); // 模拟2秒执行时间
});

// 另一个测试Agent端点
app.post('/api/agents/cryptoAgent/generate', (req, res) => {
  console.log('收到加密货币查询请求:', req.body);
  
  const { messages } = req.body;
  const userMessage = messages?.[0]?.content || '';
  
  setTimeout(() => {
    const response = {
      text: `# 加密货币市场分析 📈

## 当前市场状况

### Bitcoin (BTC)
- **当前价格**: $${(Math.random() * 10000 + 40000).toFixed(2)}
- **24h变化**: ${(Math.random() * 10 - 5).toFixed(2)}%
- **市值**: $${(Math.random() * 100 + 800).toFixed(0)}B

### Ethereum (ETH)
- **当前价格**: $${(Math.random() * 1000 + 2000).toFixed(2)}
- **24h变化**: ${(Math.random() * 8 - 4).toFixed(2)}%
- **市值**: $${(Math.random() * 50 + 200).toFixed(0)}B

## 市场趋势分析

根据最新数据分析：

1. **技术指标**
   - RSI: ${(Math.random() * 40 + 30).toFixed(0)}
   - MACD: ${Math.random() > 0.5 ? '看涨' : '看跌'}
   - 成交量: ${Math.random() > 0.5 ? '增长' : '下降'}

2. **市场情绪**
   - 恐慌贪婪指数: ${(Math.random() * 100).toFixed(0)}
   - 市场情绪: ${['极度恐慌', '恐慌', '中性', '贪婪', '极度贪婪'][Math.floor(Math.random() * 5)]}

> ⚠️ **风险提示**: 以上数据仅供测试使用，不构成投资建议。

**数据更新时间**: ${new Date().toLocaleString()}`
    };
    
    res.json(response);
  }, 1500);
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`测试Agent服务运行在端口 ${PORT}`);
  console.log(`可用端点:`);
  console.log(`- POST http://localhost:${PORT}/api/agents/testAgent/generate`);
  console.log(`- POST http://localhost:${PORT}/api/agents/cryptoAgent/generate`);
});