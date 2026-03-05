/**
 * 测试注销操作的401错误
 */
const request = require('supertest');
const app = require('./app');

async function testLogout() {
  console.log('开始测试注销操作...');
  
  try {
    // 1. 注册新用户
    console.log('1. 注册新用户...');
    const registerResponse = await request(app)
      .post('/auth/register')
      .send({
        username: 'testuser' + Date.now(),
        email: 'test' + Date.now() + '@example.com',
        password: 'password123'
      })
      .set('Accept', 'application/json');
    
    console.log('注册响应状态码:', registerResponse.status);
    console.log('注册响应:', registerResponse.body);
    
    if (!registerResponse.body.success) {
      console.error('注册失败:', registerResponse.body.error);
      return;
    }
    
    const token = registerResponse.body.data.token;
    console.log('获取到token:', token.substring(0, 50) + '...');
    
    // 2. 测试注销操作
    console.log('\n2. 测试注销操作...');
    const logoutResponse = await request(app)
      .post('/auth/delete-account')
      .send({
        password: 'password123'
      })
      .set('Authorization', `Bearer ${token}`)
      .set('Accept', 'application/json');
    
    console.log('注销响应状态码:', logoutResponse.status);
    console.log('注销响应:', logoutResponse.body);
    
    if (logoutResponse.status === 401) {
      console.error('❌ 注销操作返回401错误:', logoutResponse.body.error);
    } else {
      console.log('✅ 注销操作成功');
    }
    
    // 3. 测试无token的情况
    console.log('\n3. 测试无token的情况...');
    const noTokenResponse = await request(app)
      .post('/auth/delete-account')
      .send({
        password: 'password123'
      })
      .set('Accept', 'application/json');
    
    console.log('无token响应状态码:', noTokenResponse.status);
    console.log('无token响应:', noTokenResponse.body);
    
    // 4. 测试错误token的情况
    console.log('\n4. 测试错误token的情况...');
    const wrongTokenResponse = await request(app)
      .post('/auth/delete-account')
      .send({
        password: 'password123'
      })
      .set('Authorization', 'Bearer wrongtoken123')
      .set('Accept', 'application/json');
    
    console.log('错误token响应状态码:', wrongTokenResponse.status);
    console.log('错误token响应:', wrongTokenResponse.body);
    
  } catch (error) {
    console.error('测试过程中出现错误:', error);
  }
}

testLogout();
