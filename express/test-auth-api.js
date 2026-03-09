const http = require('http');

const BASE_URL = 'http://localhost:3000';

function makeRequest(method, path, data) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port || 3000,
      path: url.pathname,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (data && data.token) {
      options.headers['Authorization'] = `Bearer ${data.token}`;
      delete data.token;
    }

    const req = http.request(options, (res) => {
      let body = '';
      
      res.on('data', (chunk) => {
        body += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: response
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: body
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data && Object.keys(data).length > 0) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

async function runTests() {
  console.log('=== 开始测试认证接口 ===\n');

  try {
    console.log('测试 1: 注册新用户');
    console.log('请求：POST /api/auth/register');
    const registerData = {
      username: `testuser_${Date.now()}`,
      password: 'test123456',
      real_name: '测试用户',
      phone: `138${Date.now().toString().slice(-8)}`
    };
    console.log('数据:', JSON.stringify(registerData, null, 2));
    
    const registerRes = await makeRequest('POST', '/register', registerData);
    console.log('响应状态:', registerRes.statusCode);
    console.log('响应数据:', JSON.stringify(registerRes.data, null, 2));
    console.log('✓ 注册测试完成\n');

    console.log('测试 2: 使用正确的凭据登录');
    console.log('请求：POST /api/auth/login');
    const loginData = {
      identifier: registerData.username,
      password: registerData.password
    };
    console.log('数据:', JSON.stringify(loginData, null, 2));
    
    const loginRes = await makeRequest('POST', '/login', loginData);
    console.log('响应状态:', loginRes.statusCode);
    console.log('响应数据:', JSON.stringify(loginRes.data, null, 2));
    
    if (loginRes.data.success && loginRes.data.data.token) {
      const token = loginRes.data.data.token;
      console.log('✓ 登录成功，获取到 JWT 令牌\n');

      console.log('测试 3: 使用 JWT 令牌获取用户信息');
      console.log('请求：GET /api/auth/profile');
      
      const profileRes = await makeRequest('GET', '/profile', { token });
      console.log('响应状态:', profileRes.statusCode);
      console.log('响应数据:', JSON.stringify(profileRes.data, null, 2));
      console.log('✓ 获取用户信息成功\n');

      console.log('测试 4: 使用无效令牌访问');
      const invalidTokenRes = await makeRequest('GET', '/profile', { token: 'invalid_token' });
      console.log('响应状态:', invalidTokenRes.statusCode);
      console.log('响应数据:', JSON.stringify(invalidTokenRes.data, null, 2));
      console.log('✓ 无效令牌测试完成\n');

      console.log('测试 5: 无令牌访问');
      const noTokenRes = await makeRequest('GET', '/profile', {});
      console.log('响应状态:', noTokenRes.statusCode);
      console.log('响应数据:', JSON.stringify(noTokenRes.data, null, 2));
      console.log('✓ 无令牌测试完成\n');
    }

    console.log('测试 6: 重复注册（用户名已存在）');
    const duplicateRegisterRes = await makeRequest('POST', '/register', registerData);
    console.log('响应状态:', duplicateRegisterRes.statusCode);
    console.log('响应数据:', JSON.stringify(duplicateRegisterRes.data, null, 2));
    console.log('✓ 重复注册测试完成\n');

    console.log('测试 7: 错误密码登录');
    const wrongPasswordRes = await makeRequest('POST', '/login', {
      identifier: registerData.username,
      password: 'wrong_password'
    });
    console.log('响应状态:', wrongPasswordRes.statusCode);
    console.log('响应数据:', JSON.stringify(wrongPasswordRes.data, null, 2));
    console.log('✓ 错误密码测试完成\n');

    console.log('测试 8: 验证输入（短密码）');
    const shortPasswordRes = await makeRequest('POST', '/register', {
      username: `testuser_short_${Date.now()}`,
      password: '123'
    });
    console.log('响应状态:', shortPasswordRes.statusCode);
    console.log('响应数据:', JSON.stringify(shortPasswordRes.data, null, 2));
    console.log('✓ 短密码验证测试完成\n');

    console.log('测试 9: 验证输入（无效用户名）');
    const invalidUsernameRes = await makeRequest('POST', '/register', {
      username: 'invalid@user',
      password: 'validpassword123'
    });
    console.log('响应状态:', invalidUsernameRes.statusCode);
    console.log('响应数据:', JSON.stringify(invalidUsernameRes.data, null, 2));
    console.log('✓ 无效用户名验证测试完成\n');

    console.log('=== 所有测试完成 ===');

  } catch (error) {
    console.error('测试执行失败:', error.message);
    console.error('请确保服务器正在运行：npm start');
  }
}

runTests();
