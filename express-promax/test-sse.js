const http = require('http');

// 测试温度采集控制API
function testTemperatureAPI() {
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
      console.log('响应状态:', res.statusCode);
      console.log('响应数据:', data);
    });
  });

  req.on('error', (error) => {
    console.error('请求错误:', error);
  });

  req.write(postData);
  req.end();
}

// 测试SSE连接
function testSSEConnection() {
  console.log('开始测试SSE连接...');
  
  const eventSource = new EventSource('http://localhost:3000/api/temperature/stream');
  
  eventSource.onopen = function() {
    console.log('SSE连接已建立');
  };
  
  eventSource.onmessage = function(event) {
    console.log('收到消息:', event.data);
  };
  
  eventSource.addEventListener('temperature', function(event) {
    const data = JSON.parse(event.data);
    console.log('收到温度数据:', data);
  });
  
  eventSource.addEventListener('connected', function(event) {
    const data = JSON.parse(event.data);
    console.log('连接确认:', data);
  });
  
  eventSource.addEventListener('heartbeat', function(event) {
    console.log('收到心跳');
  });
  
  eventSource.onerror = function(error) {
    console.error('SSE错误:', error);
    eventSource.close();
  };
  
  // 30秒后关闭连接
  setTimeout(() => {
    console.log('关闭SSE连接');
    eventSource.close();
  }, 30000);
}

// 运行测试
console.log('开始API测试...');
testTemperatureAPI();

setTimeout(() => {
  testSSEConnection();
}, 2000);