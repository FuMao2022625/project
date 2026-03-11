const net = require('net');
const dataProcessor = require('./data-processor');

const PORT = 8080;
const HOST = '0.0.0.0';

const clients = new Map();
let clientIdCounter = 0;

function getTimestamp() {
  return new Date().toISOString();
}

function getClientInfo(socket) {
  const remoteAddress = socket.remoteAddress;
  const remotePort = socket.remotePort;
  return `${remoteAddress}:${remotePort}`;
}

dataProcessor.initialize();

const server = net.createServer((socket) => {
  const clientId = ++clientIdCounter;
  const clientInfo = getClientInfo(socket);
  
  clients.set(clientId, socket);
  
  socket.setEncoding('utf8');
  
  console.log(`[${getTimestamp()}] 客户端 #${clientId} 已连接 - ${clientInfo}`);
  console.log(`[${getTimestamp()}] 当前连接数: ${clients.size}`);
  
  socket.on('data', async (data) => {
    try {
      console.log(`[${getTimestamp()}] 客户端 #${clientId} (${clientInfo}) 发送数据:`);
      console.log(`  数据内容: ${data.trim()}`);
      console.log(`  数据长度: ${data.length} 字节`);
      console.log('---');
      
      const result = await dataProcessor.processRawData(data, clientInfo);
      
      if (result.success) {
        socket.write(`数据处理成功 [ID: ${result.processingId}]\n`);
        console.log(`[${getTimestamp()}] 数据处理成功 [ID: ${result.processingId}]`);
      } else {
        socket.write(`数据处理失败: ${result.error}\n`);
        console.log(`[${getTimestamp()}] 数据处理失败: ${result.error}`);
      }
      
    } catch (error) {
      console.error(`[${getTimestamp()}] 处理客户端 #${clientId} 数据时出错:`, error.message);
      socket.write(`服务器处理错误: ${error.message}\n`);
    }
  });
  
  socket.on('end', () => {
    console.log(`[${getTimestamp()}] 客户端 #${clientId} (${clientInfo}) 主动断开连接`);
    clients.delete(clientId);
    console.log(`[${getTimestamp()}] 当前连接数: ${clients.size}`);
  });
  
  socket.on('error', (error) => {
    console.error(`[${getTimestamp()}] 客户端 #${clientId} (${clientInfo}) 连接错误:`, error.message);
    
    if (error.code === 'ECONNRESET') {
      console.log(`  连接被客户端重置`);
    } else if (error.code === 'ETIMEDOUT') {
      console.log(`  连接超时`);
    } else if (error.code === 'EPIPE') {
      console.log(`  管道断裂，客户端可能已关闭连接`);
    } else {
      console.log(`  错误代码: ${error.code}`);
    }
    
    clients.delete(clientId);
    console.log(`[${getTimestamp()}] 当前连接数: ${clients.size}`);
  });
  
  socket.on('timeout', () => {
    console.log(`[${getTimestamp()}] 客户端 #${clientId} (${clientInfo}) 连接超时`);
    socket.end();
  });
  
  socket.on('close', (hadError) => {
    if (hadError) {
      console.log(`[${getTimestamp()}] 客户端 #${clientId} (${clientInfo}) 连接异常关闭`);
    } else {
      console.log(`[${getTimestamp()}] 客户端 #${clientId} (${clientInfo}) 连接正常关闭`);
    }
    
    if (clients.has(clientId)) {
      clients.delete(clientId);
      console.log(`[${getTimestamp()}] 当前连接数: ${clients.size}`);
    }
  });
  
  socket.write(`欢迎连接到热成像传感器数据服务器！\n`);
  socket.write(`你的客户端ID: ${clientId}\n`);
  socket.write(`当前连接数: ${clients.size}\n`);
  socket.write(`请发送JSON格式的传感器数据\n\n`);
});

server.on('error', (error) => {
  console.error(`[${getTimestamp()}] 服务器错误:`, error.message);
  
  if (error.code === 'EADDRINUSE') {
    console.error(`端口 ${PORT} 已被占用，请检查是否有其他程序正在使用该端口`);
  } else if (error.code === 'EACCES') {
    console.error(`权限不足，无法绑定到端口 ${PORT}`);
  } else {
    console.error(`错误代码: ${error.code}`);
  }
  
  dataProcessor.closeDatabase();
  process.exit(1);
});

server.on('close', () => {
  console.log(`[${getTimestamp()}] 服务器已关闭`);
});

process.on('SIGINT', () => {
  console.log(`\n[${getTimestamp()}] 收到退出信号，正在关闭服务器...`);
  
  clients.forEach((socket, clientId) => {
    try {
      socket.write('服务器即将关闭，再见！\n');
      socket.end();
    } catch (error) {
      console.error(`关闭客户端 #${clientId} 连接时出错:`, error.message);
    }
  });
  
  dataProcessor.closeDatabase();
  
  server.close(() => {
    console.log(`[${getTimestamp()}] 服务器已成功关闭`);
    process.exit(0);
  });
  
  setTimeout(() => {
    console.error(`[${getTimestamp()}] 强制退出`);
    process.exit(1);
  }, 5000);
});

server.listen(PORT, HOST, () => {
  console.log('='.repeat(60));
  console.log(`[${getTimestamp()}] 热成像传感器数据服务器已成功启动`);
  console.log(`[${getTimestamp()}] 监听地址: ${HOST}:${PORT}`);
  console.log(`[${getTimestamp()}] 等待客户端连接...`);
  console.log('='.repeat(60));
  console.log('');
});

server.on('connection', (socket) => {
  socket.setTimeout(300000);
});

module.exports = server;
