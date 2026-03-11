const net = require('net');

// 配置参数
const PORT = 8080;
const HOST = '127.0.0.1';

// 获取格式化的时间戳
function getTimestamp() {
  return new Date().toISOString();
}

// 创建 Socket 客户端
const client = net.createConnection({ port: PORT, host: HOST }, () => {
  console.log(`[${getTimestamp()}] 已成功连接到服务器 ${HOST}:${PORT}`);
  
  // 设置编码格式为 UTF-8
  client.setEncoding('utf8');
  
  // 发送测试数据
  const testMessages = [
    'Hello, Server!',
    '这是第一条测试消息',
    '这是第二条测试消息',
    '测试中文编码',
    'Test English encoding',
    '测试数字: 12345',
    '测试特殊字符: !@#$%^&*()',
    '测试长消息: ' + 'A'.repeat(100)
  ];
  
  // 每隔2秒发送一条消息
  let messageIndex = 0;
  const sendInterval = setInterval(() => {
    if (messageIndex < testMessages.length) {
      const message = testMessages[messageIndex];
      console.log(`[${getTimestamp()}] 发送消息: ${message}`);
      client.write(message + '\n');
      messageIndex++;
    } else {
      clearInterval(sendInterval);
      console.log(`[${getTimestamp()}] 所有测试消息已发送完毕`);
      
      // 5秒后断开连接
      setTimeout(() => {
        console.log(`[${getTimestamp()}] 正在断开连接...`);
        client.end();
      }, 5000);
    }
  }, 2000);
});

// 处理接收到的数据
client.on('data', (data) => {
  console.log(`[${getTimestamp()}] 收到服务器响应:`);
  console.log(`  ${data.trim()}`);
  console.log('---');
});

// 处理连接关闭
client.on('end', () => {
  console.log(`[${getTimestamp()}] 服务器已关闭连接`);
});

// 处理连接错误
client.on('error', (error) => {
  console.error(`[${getTimestamp()}] 连接错误:`, error.message);
  
  if (error.code === 'ECONNREFUSED') {
    console.error(`无法连接到服务器，请确保服务器正在运行`);
  } else if (error.code === 'ETIMEDOUT') {
    console.error(`连接超时`);
  } else {
    console.error(`错误代码: ${error.code}`);
  }
  
  process.exit(1);
});

// 处理进程退出
process.on('SIGINT', () => {
  console.log(`\n[${getTimestamp()}] 收到退出信号，正在断开连接...`);
  client.end();
  process.exit(0);
});

// 设置连接超时
client.setTimeout(300000); // 5分钟超时

client.on('timeout', () => {
  console.log(`[${getTimestamp()}] 连接超时`);
  client.end();
});
