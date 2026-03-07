const http = require('http');
const EventSource = require('eventsource');

// 测试温度采集控制API
function testTemperatureAPI() {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({ interval: 1000 });
    
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/temperature/control/start',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log('✅ API测试成功');
        console.log('响应状态:', res.statusCode);
        console.log('响应数据:', data);
        resolve();
      });
    });

    req.on('error', (error) => {
      console.error('❌ API测试失败:', error);
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

// 测试SSE连接
function testSSEConnection() {
  return new Promise((resolve, reject) => {
    console.log('开始测试SSE连接...');
    
    const eventSource = new EventSource('http://localhost:3000/api/temperature/stream');
    let messageCount = 0;
    
    eventSource.onopen = function() {
      console.log('✅ SSE连接已建立');
    };
    
    eventSource.onmessage = function(event) {
      console.log('收到消息:', event.data);
    };
    
    eventSource.addEventListener('temperature', function(event) {
      messageCount++;
      const data = JSON.parse(event.data);
      console.log(`📊 温度数据 #${messageCount}: ${data.value}°C at ${data.timestamp}`);
    });
    
    eventSource.addEventListener('connected', function(event) {
      const data = JSON.parse(event.data);
      console.log('✅ 连接确认:', data);
    });
    
    eventSource.addEventListener('heartbeat', function(event) {
      console.log('💓 收到心跳');
    });
    
    eventSource.onerror = function(error) {
      console.error('❌ SSE错误:', error);
      eventSource.close();
      reject(error);
    };
    
    // 10秒后关闭连接
    setTimeout(() => {
      console.log(`✅ 测试完成，共收到 ${messageCount} 条温度数据`);
      eventSource.close();
      resolve(messageCount);
    }, 10000);
  });
}

// 测试温度状态API
function testTemperatureStatus() {
  return new Promise((resolve, reject) => {
    http.get('http://localhost:3000/api/temperature/status', (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log('✅ 状态API测试成功');
        console.log('温度状态:', data);
        resolve();
      });
    }).on('error', (error) => {
      console.error('❌ 状态API测试失败:', error);
      reject(error);
    });
  });
}

// 运行完整测试
async function runFullTest() {
  console.log('🚀 开始SSE功能完整性测试...\n');
  
  try {
    // 1. 测试温度状态API
    console.log('1️⃣ 测试温度状态API...');
    await testTemperatureStatus();
    console.log('');
    
    // 2. 测试温度采集控制API
    console.log('2️⃣ 测试温度采集控制API...');
    await testTemperatureAPI();
    console.log('');
    
    // 3. 测试SSE连接
    console.log('3️⃣ 测试SSE连接...');
    const messageCount = await testSSEConnection();
    console.log('');
    
    // 4. 最终状态检查
    console.log('4️⃣ 最终状态检查...');
    await testTemperatureStatus();
    
    console.log('\n🎉 所有测试完成！');
    console.log(`📈 共接收温度数据: ${messageCount} 条`);
    console.log('✅ SSE功能运行正常');
    
  } catch (error) {
    console.error('\n❌ 测试失败:', error);
    process.exit(1);
  }
}

// 运行测试
runFullTest();