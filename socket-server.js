const net = require('net');

// 配置参数
const PORT = 8080;
const HOST = '0.0.0.0';

// 存储所有客户端连接
const clients = new Map();
let clientIdCounter = 0;

// 获取格式化的时间戳
function getTimestamp() {
  return new Date().toISOString();
}

// 获取客户端信息
function getClientInfo(socket) {
  const remoteAddress = socket.remoteAddress;
  const remotePort = socket.remotePort;
  return `${remoteAddress}:${remotePort}`;
}

// 创建 Socket 服务器
const server = net.createServer((socket) => {
  // 生成唯一客户端ID
  const clientId = ++clientIdCounter;
  const clientInfo = getClientInfo(socket);
  
  // 存储客户端连接
  clients.set(clientId, socket);
  
  // 设置编码格式为 UTF-8
  socket.setEncoding('utf8');
  
  // 打印连接日志
  console.log(`[${getTimestamp()}] 客户端 #${clientId} 已连接 - ${clientInfo}`);
  console.log(`[${getTimestamp()}] 当前连接数: ${clients.size}`);
  
  // 处理接收到的数据
  socket.on('data', (data) => {
    try {
      // 打印接收到的数据
      console.log(`[${getTimestamp()}] 客户端 #${clientId} (${clientInfo}) 发送数据:`);
      console.log(`  数据内容: ${data.trim()}`);
      console.log(`  数据长度: ${data.length} 字节`);
      console.log(`  数据类型: ${typeof data}`);
      console.log('---');
      
      // 回显数据给客户端（可选）
      socket.write(`服务器已收到数据: ${data.trim()}\n`);
      
    } catch (error) {
      console.error(`[${getTimestamp()}] 处理客户端 #${clientId} 数据时出错:`, error.message);
    }
  });
  
  // 处理客户端断开连接
  socket.on('end', () => {
    console.log(`[${getTimestamp()}] 客户端 #${clientId} (${clientInfo}) 主动断开连接`);
    clients.delete(clientId);
    console.log(`[${getTimestamp()}] 当前连接数: ${clients.size}`);
  });
  
  // 处理连接错误
  socket.on('error', (error) => {
    console.error(`[${getTimestamp()}] 客户端 #${clientId} (${clientInfo}) 连接错误:`, error.message);
    
    // 根据错误类型进行不同处理
    if (error.code === 'ECONNRESET') {
      console.log(`  连接被客户端重置`);
    } else if (error.code === 'ETIMEDOUT') {
      console.log(`  连接超时`);
    } else if (error.code === 'EPIPE') {
      console.log(`  管道断裂，客户端可能已关闭连接`);
    } else {
      console.log(`  错误代码: ${error.code}`);
    }
    
    // 清理客户端连接
    clients.delete(clientId);
    console.log(`[${getTimestamp()}] 当前连接数: ${clients.size}`);
  });
  
  // 处理连接超时
  socket.on('timeout', () => {
    console.log(`[${getTimestamp()}] 客户端 #${clientId} (${clientInfo}) 连接超时`);
    socket.end();
  });
  
  // 处理连接关闭
  socket.on('close', (hadError) => {
    if (hadError) {
      console.log(`[${getTimestamp()}] 客户端 #${clientId} (${clientInfo}) 连接异常关闭`);
    } else {
      console.log(`[${getTimestamp()}] 客户端 #${clientId} (${clientInfo}) 连接正常关闭`);
    }
    
    // 确保从客户端列表中删除
    if (clients.has(clientId)) {
      clients.delete(clientId);
      console.log(`[${getTimestamp()}] 当前连接数: ${clients.size}`);
    }
  });
  
  // 向客户端发送欢迎消息
  socket.write(`欢迎连接到 Socket 服务器！\n`);
  socket.write(`你的客户端ID: ${clientId}\n`);
  socket.write(`当前连接数: ${clients.size}\n`);
  socket.write(`发送任何数据，服务器将回显给你\n\n`);
});

// 处理服务器错误
server.on('error', (error) => {
  console.error(`[${getTimestamp()}] 服务器错误:`, error.message);
  
  if (error.code === 'EADDRINUSE') {
    console.error(`端口 ${PORT} 已被占用，请检查是否有其他程序正在使用该端口`);
  } else if (error.code === 'EACCES') {
    console.error(`权限不足，无法绑定到端口 ${PORT}`);
  } else {
    console.error(`错误代码: ${error.code}`);
  }
  
  process.exit(1);
});

// 处理服务器关闭
server.on('close', () => {
  console.log(`[${getTimestamp()}] 服务器已关闭`);
});

// 处理进程退出
process.on('SIGINT', () => {
  console.log(`\n[${getTimestamp()}] 收到退出信号，正在关闭服务器...`);
  
  // 关闭所有客户端连接
  clients.forEach((socket, clientId) => {
    try {
      socket.write('服务器即将关闭，再见！\n');
      socket.end();
    } catch (error) {
      console.error(`关闭客户端 #${clientId} 连接时出错:`, error.message);
    }
  });
  
  // 关闭服务器
  server.close(() => {
    console.log(`[${getTimestamp()}] 服务器已成功关闭`);
    process.exit(0);
  });
  
  // 5秒后强制退出
  setTimeout(() => {
    console.error(`[${getTimestamp()}] 强制退出`);
    process.exit(1);
  }, 5000);
});

// 启动服务器
server.listen(PORT, HOST, () => {
  console.log('='.repeat(60));
  console.log(`[${getTimestamp()}] Socket 服务器已成功启动`);
  console.log(`[${getTimestamp()}] 监听地址: ${HOST}:${PORT}`);
  console.log(`[${getTimestamp()}] 等待客户端连接...`);
  console.log('='.repeat(60));
  console.log('');
});

// 设置连接超时（可选）
server.on('connection', (socket) => {
  socket.setTimeout(300000); // 5分钟超时
});

module.exports = server;
