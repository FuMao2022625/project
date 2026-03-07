const http = require('http');

// 简单的SSE客户端测试
function testSSE() {
  console.log('🧪 开始测试SSE连接...');
  
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/temperature/stream',
    method: 'GET',
    headers: {
      'Accept': 'text/event-stream',
      'Cache-Control': 'no-cache'
    }
  };

  const req = http.request(options, (res) => {
    console.log('✅ 连接建立，状态码:', res.statusCode);
    console.log('📋 响应头:', res.headers);
    
    let buffer = '';
    let messageCount = 0;
    
    res.on('data', (chunk) => {
      buffer += chunk.toString();
      
      // 处理SSE数据
      const lines = buffer.split('\n');
      buffer = lines.pop(); // 保留最后一行不完整的数据
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.substring(6);
          try {
            const parsed = JSON.parse(data);
            messageCount++;
            console.log(`📊 收到数据 #${messageCount}:`, parsed);
          } catch (e) {
            console.log('📄 原始数据:', data);
          }
        } else if (line.startsWith('event: ')) {
          const event = line.substring(7);
          console.log(`🎯 事件类型: ${event}`);
        }
      }
    });
    
    res.on('end', () => {
      console.log(`✅ 连接结束，共收到 ${messageCount} 条消息`);
    });
    
    res.on('error', (error) => {
      console.error('❌ 响应错误:', error);
    });
  });

  req.on('error', (error) => {
    console.error('❌ 请求错误:', error);
  });

  req.on('timeout', () => {
    console.log('⏰ 请求超时');
    req.destroy();
  });

  req.setTimeout(15000); // 15秒超时
  req.end();
}

// 测试温度状态
function testTemperatureStatus() {
  return new Promise((resolve, reject) => {
    http.get('http://localhost:3000/api/temperature/status', (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log('✅ 温度状态API测试成功');
        console.log('温度状态:', data);
        resolve();
      });
    }).on('error', (error) => {
      console.error('❌ 温度状态API测试失败:', error);
      reject(error);
    });
  });
}

// 运行测试
async function runTests() {
  console.log('🚀 开始SSE功能测试...\n');
  
  try {
    // 1. 测试温度状态API
    console.log('1️⃣ 测试温度状态API...');
    await testTemperatureStatus();
    console.log('');
    
    // 2. 测试SSE连接
    console.log('2️⃣ 测试SSE连接...');
    testSSE();
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
  }
}

runTests();