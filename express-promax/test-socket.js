const net = require('net');

// Socket服务器配置
const SOCKET_CONFIG = {
  host: 'localhost',
  port: 8080
};

// 创建设备客户端
function createDeviceClient(deviceId) {
  const client = net.createConnection(SOCKET_CONFIG, () => {
    console.log(`设备 ${deviceId} 已连接到服务器`);
    
    // 发送设备数据
    setInterval(() => {
      const data = {
        temperature: (20 + Math.random() * 10).toFixed(2),
        humidity: (40 + Math.random() * 30).toFixed(2),
        pressure: (1000 + Math.random() * 50).toFixed(2)
      };
      
      const dataFrame = `${deviceId},${new Date().toISOString()},sensor,${JSON.stringify(data)}\n`;
      client.write(dataFrame);
      console.log(`设备 ${deviceId} 发送数据: ${dataFrame.trim()}`);
    }, 2000);
  });
  
  // 处理服务器响应
  client.on('data', (data) => {
    console.log(`设备 ${deviceId} 收到服务器响应: ${data.toString()}`);
  });
  
  // 处理连接错误
  client.on('error', (error) => {
    console.error(`设备 ${deviceId} 连接错误:`, error);
  });
  
  // 处理连接关闭
  client.on('close', () => {
    console.log(`设备 ${deviceId} 连接已关闭`);
  });
  
  return client;
}

// 创建多个设备客户端
const devices = [
  'DEVICE-12345678',
  'DEVICE-87654321',
  'DEVICE-ABCDEFGH'
];

devices.forEach(deviceId => {
  createDeviceClient(deviceId);
});

console.log('Socket测试客户端已启动');
console.log(`连接到 ${SOCKET_CONFIG.host}:${SOCKET_CONFIG.port}`);
console.log('按 Ctrl+C 退出');
