const http = require('http');

const testCases = [
  {
    name: '允许 localhost:3000 访问',
    origin: 'http://localhost:3000',
    expected: true
  },
  {
    name: '允许 localhost:8080 访问',
    origin: 'http://localhost:8080',
    expected: true
  },
  {
    name: '允许 127.0.0.1:3000 访问',
    origin: 'http://127.0.0.1:3000',
    expected: true
  },
  {
    name: '允许 127.0.0.1:8080 访问',
    origin: 'http://127.0.0.1:8080',
    expected: true
  },
  {
    name: '拒绝恶意域名访问',
    origin: 'http://evil.com',
    expected: false
  },
  {
    name: '无 origin 的请求（服务器端调用，不检查 CORS）',
    origin: null,
    expected: false
  },
  {
    name: '测试实际 GET 请求的 CORS 响应',
    origin: 'http://localhost:3000',
    method: 'GET',
    path: '/api/auth',
    expected: true
  }
];

async function testCORS() {
  console.log('开始测试 CORS 配置...\n');
  
  for (const testCase of testCases) {
    await new Promise((resolve) => {
      const options = {
        hostname: 'localhost',
        port: 3000,
        path: testCase.path || '/',
        method: testCase.method || 'OPTIONS',
        headers: {
          'Origin': testCase.origin,
        }
      };

      if (testCase.method === 'OPTIONS') {
        options.headers['Access-Control-Request-Method'] = 'GET';
        options.headers['Access-Control-Request-Headers'] = 'Content-Type, Authorization';
      }

      const req = http.request(options, (res) => {
        const corsHeader = res.headers['access-control-allow-origin'];
        const allowed = corsHeader !== undefined;
        
        const status = allowed === testCase.expected ? '✓ 通过' : '✗ 失败';
        console.log(`${status} - ${testCase.name}`);
        console.log(`  请求方法：${testCase.method || 'OPTIONS'}`);
        console.log(`  请求 Origin: ${testCase.origin}`);
        console.log(`  响应 Access-Control-Allow-Origin: ${corsHeader || '无'}`);
        console.log(`  响应 Access-Control-Allow-Methods: ${res.headers['access-control-allow-methods'] || '无'}`);
        console.log(`  响应 Access-Control-Allow-Headers: ${res.headers['access-control-allow-headers'] || '无'}`);
        console.log(`  响应 Access-Control-Allow-Credentials: ${res.headers['access-control-allow-credentials'] || '无'}`);
        console.log(`  响应状态码：${res.statusCode}`);
        console.log('');
        
        resolve();
      });

      req.on('error', (e) => {
        console.log(`✗ 失败 - ${testCase.name}`);
        console.log(`  错误：${e.message}\n`);
        resolve();
      });

      req.end();
    });
    
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log('CORS 测试完成！');
}

testCORS().catch(console.error);
