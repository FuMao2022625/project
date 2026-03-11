const net = require('net');

// 配置参数
const PORT = 8080;
const HOST = '127.0.0.1';

// 获取格式化的时间戳
function getTimestamp() {
  return new Date().toISOString();
}

// 热成像传感器数据模板
const sensorData = {
  type: "THERMAL-SENSOR-001",
  temperature: 25.5,
  humidity: 65.2,
  smoke_level: 0.15,
  max_temp: [
    [22.5, 23.1, 24.2, 25.0, 25.8, 26.3, 26.8, 27.2],
    [23.0, 23.6, 24.8, 25.5, 26.2, 26.7, 27.1, 27.5],
    [23.5, 24.2, 25.3, 26.0, 26.8, 27.2, 27.6, 28.0],
    [24.0, 24.8, 25.9, 26.5, 27.2, 27.6, 28.1, 28.5],
    [24.5, 25.3, 26.4, 27.0, 27.7, 28.1, 28.6, 29.0],
    [25.0, 25.8, 26.9, 27.5, 28.2, 28.6, 29.1, 29.5],
    [25.5, 26.3, 27.4, 28.0, 28.7, 29.1, 29.6, 30.0],
    [26.0, 26.8, 27.9, 28.5, 29.2, 29.6, 30.1, 30.5]
  ],
  human_detected: true,
  fire_risk: "LOW",
  env_status: "NORMAL",
  battery: 85.5
};

// 生成随机温度数据（在基础值上波动）
function generateRandomTemp(baseTemp, variance) {
  return parseFloat((baseTemp + (Math.random() - 0.5) * variance).toFixed(1));
}

// 生成随机温度矩阵
function generateRandomTempMatrix() {
  const matrix = [];
  for (let i = 0; i < 8; i++) {
    const row = [];
    for (let j = 0; j < 8; j++) {
      row.push(generateRandomTemp(25 + i * 0.5 + j * 0.3, 3));
    }
    matrix.push(row);
  }
  return matrix;
}

// 生成随机传感器数据
function generateSensorData() {
  const fireRisks = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
  const envStatuses = ["NORMAL", "WARNING", "ALERT", "EMERGENCY"];
  
  return {
    type: "THERMAL-SENSOR-001",
    temperature: generateRandomTemp(25.5, 5),
    humidity: generateRandomTemp(65.2, 10),
    smoke_level: parseFloat(Math.max(0, Math.min(1, 0.15 + (Math.random() - 0.5) * 0.1)).toFixed(3)),
    max_temp: generateRandomTempMatrix(),
    human_detected: Math.random() > 0.3,
    fire_risk: fireRisks[Math.floor(Math.random() * fireRisks.length)],
    env_status: envStatuses[Math.floor(Math.random() * envStatuses.length)],
    battery: generateRandomTemp(85.5, 5)
  };
}

// 创建 Socket 客户端
const client = net.createConnection({ port: PORT, host: HOST }, () => {
  console.log(`[${getTimestamp()}] 已成功连接到服务器 ${HOST}:${PORT}`);
  
  // 设置编码格式为 UTF-8
  client.setEncoding('utf8');
  
  console.log(`[${getTimestamp()}] 开始发送热成像传感器数据...`);
  console.log(`[${getTimestamp()}] 数据格式: ${JSON.stringify(sensorData, null, 2)}`);
  console.log('---');
  
  // 发送第一条标准数据
  const firstData = JSON.stringify(sensorData);
  console.log(`[${getTimestamp()}] 发送标准模板数据`);
  client.write(firstData + '\n');
  
  // 之后每隔5秒发送一条随机生成的数据
  let messageCount = 1;
  const sendInterval = setInterval(() => {
    const randomData = generateSensorData();
    const jsonData = JSON.stringify(randomData);
    
    console.log(`[${getTimestamp()}] 发送第 ${++messageCount} 条随机数据`);
    console.log(`  温度: ${randomData.temperature}°C, 湿度: ${randomData.humidity}%, 火灾风险: ${randomData.fire_risk}`);
    client.write(jsonData + '\n');
    
    // 发送10条后停止
    if (messageCount >= 10) {
      clearInterval(sendInterval);
      console.log(`[${getTimestamp()}] 所有数据已发送完毕`);
      
      // 3秒后断开连接
      setTimeout(() => {
        console.log(`[${getTimestamp()}] 正在断开连接...`);
        client.end();
      }, 3000);
    }
  }, 5000);
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
    console.error(`请执行: node socket-server.js`);
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
