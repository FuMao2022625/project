const http = require('http');

// 测试热成像 SSE 端点
function testThermalSSE() {
  console.log('测试热成像 SSE 端点...');
  
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/thermal-sse/stream',
    method: 'GET',
    headers: {
      'Accept': 'text/event-stream'
    }
  };
  
  const req = http.request(options, (res) => {
    console.log(`状态码: ${res.statusCode}`);
    console.log('响应头:', res.headers);
    
    let dataBuffer = '';
    
    res.on('data', (chunk) => {
      dataBuffer += chunk;
      console.log('\n接收到数据:');
      console.log(chunk.toString());
      
      // 解析 SSE 数据
      const lines = chunk.toString().split('\n');
      lines.forEach(line => {
        if (line.startsWith('data:')) {
          try {
            const jsonData = JSON.parse(line.substring(5).trim());
            console.log('解析后的数据:', jsonData);
          } catch (error) {
            console.log('解析数据失败:', error);
          }
        }
      });
    });
    
    res.on('end', () => {
      console.log('\n响应结束');
    });
  });
  
  req.on('error', (e) => {
    console.error('请求失败:', e.message);
  });
  
  req.end();
  
  // 5秒后结束测试
  setTimeout(() => {
    req.destroy();
    console.log('\n测试结束');
  }, 5000);
}

// 运行测试
testThermalSSE();