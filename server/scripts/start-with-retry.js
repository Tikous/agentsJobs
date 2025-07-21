#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

const MAX_RETRIES = 3;
const RETRY_DELAY = 5000; // 5秒

let currentRetry = 0;

function startServer() {
  console.log(`\n🚀 启动服务器 (尝试 ${currentRetry + 1}/${MAX_RETRIES})`);
  
  const server = spawn('npm', ['start'], {
    cwd: path.resolve(__dirname, '..'),
    stdio: 'inherit',
    shell: true
  });

  server.on('error', (error) => {
    console.error('❌ 启动服务器时发生错误:', error);
    handleRetry();
  });

  server.on('exit', (code) => {
    if (code !== 0) {
      console.error(`❌ 服务器异常退出，退出码: ${code}`);
      handleRetry();
    } else {
      console.log('✅ 服务器正常关闭');
    }
  });

  // 监听成功启动信号
  const timeout = setTimeout(() => {
    console.log('⏰ 启动超时，可能是数据库连接问题...');
    server.kill();
    handleRetry();
  }, 15000); // 15秒超时

  // 如果服务器成功启动，清除超时
  server.stdout?.on('data', (data) => {
    const output = data.toString();
    if (output.includes('Nest application successfully started')) {
      clearTimeout(timeout);
      console.log('✅ 服务器启动成功!');
    }
  });
}

function handleRetry() {
  currentRetry++;
  
  if (currentRetry >= MAX_RETRIES) {
    console.error(`❌ 已达到最大重试次数 (${MAX_RETRIES})，启动失败`);
    console.log('\n💡 可能的解决方案:');
    console.log('1. 检查数据库连接配置');
    console.log('2. 确认Aurora数据库实例已启动');
    console.log('3. 检查网络连接');
    console.log('4. 等待几分钟后重试（Aurora冷启动）');
    process.exit(1);
  }

  console.log(`⏳ ${RETRY_DELAY / 1000}秒后重试...`);
  setTimeout(() => {
    startServer();
  }, RETRY_DELAY);
}

console.log('🔄 Aurora数据库重连启动脚本');
console.log('📝 此脚本会自动处理Aurora数据库的冷启动问题');
startServer();