const http = require('http');

console.log('=== SSE 温度数据推送测试 ===\n');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/sse/temperature/stream?interval=1000&precision=2',
  method: 'GET',
  headers: {
    'Accept': 'text/event-stream'
  }
};

let messageCount = 0;
const maxMessages = 5;

const req = http.request(options, (res) => {
  console.log(`连接状态：${res.statusCode}`);
  console.log(`Content-Type: ${res.headers['content-type']}`);
  console.log('\n开始接收数据...\n');

  res.on('data', (chunk) => {
    const data = chunk.toString();
    const lines = data.split('\n');

    lines.forEach(line => {
      if (line.startsWith('data: ')) {
        try {
          const jsonData = JSON.parse(line.substring(6));
          messageCount++;

          console.log(`[${messageCount}] 类型：${jsonData.type}`);
          
          if (jsonData.type === 'connected') {
            console.log(`    客户端 ID: ${jsonData.clientId}`);
            console.log(`    连接时间：${jsonData.timestamp}`);
          } else if (jsonData.type === 'temperature_update') {
            const data = jsonData.data;
            console.log(`    温度：${data.temperature}°C`);
            console.log(`    湿度：${data.humidity}%`);
            console.log(`    最高温度：${data.max_temp}°C`);
            console.log(`    烟雾浓度：${data.smoke_level} ppm`);
            console.log(`    时间：${new Date(data.data_time).toLocaleTimeString('zh-CN')}`);
          } else if (jsonData.type === 'heartbeat') {
            console.log(`    心跳时间：${jsonData.timestamp}`);
          }

          console.log('');

          if (messageCount >= maxMessages) {
            console.log(`✓ 已接收 ${maxMessages} 条消息，测试完成`);
            req.destroy();
            process.exit(0);
          }
        } catch (error) {
          console.log('原始数据:', line);
        }
      }
    });
  });

  res.on('error', (error) => {
    console.error('接收错误:', error.message);
    process.exit(1);
  });

  res.on('end', () => {
    console.log('连接已关闭');
  });
});

req.on('error', (error) => {
  console.error('请求错误:', error.message);
  process.exit(1);
});

req.on('close', () => {
  console.log('请求已关闭');
});

req.end();

setTimeout(() => {
  if (messageCount < maxMessages) {
    console.log('\n超时，测试终止');
    process.exit(1);
  }
}, 10000);
