const request = require('supertest');
const app = require('../app');

// 测试注册接口
describe('Auth API', () => {
  let token;

  // 测试注册功能
  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'Test@1234'
        });
      expect(res.statusCode).toBe(201);
      expect(res.body.message).toBe('注册成功');
    });

    it('should return error for invalid username', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'test', // 用户名长度不足
          email: 'test2@example.com',
          password: 'Test@1234'
        });
      expect(res.statusCode).toBe(400);
      expect(res.body.errors).toBeDefined();
    });

    it('should return error for invalid email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser2',
          email: 'invalid-email', // 无效的邮箱格式
          password: 'Test@1234'
        });
      expect(res.statusCode).toBe(400);
      expect(res.body.errors).toBeDefined();
    });

    it('should return error for invalid password', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser3',
          email: 'test3@example.com',
          password: '12345678' // 密码不包含大小写字母和特殊符号
        });
      expect(res.statusCode).toBe(400);
      expect(res.body.errors).toBeDefined();
    });
  });

  // 测试登录功能
  describe('POST /api/auth/login', () => {
    it('should login successfully', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Test@1234'
        });
      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('登录成功');
      expect(res.body.token).toBeDefined();
      token = res.body.token; // 保存token用于后续测试
    });

    it('should return error for invalid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrong-password'
        });
      expect(res.statusCode).toBe(401);
      expect(res.body.error).toBe('电子邮箱或密码错误');
    });
  });

  // 测试验证功能
  describe('GET /api/auth/verify', () => {
    it('should verify token successfully', async () => {
      const res = await request(app)
        .get('/api/auth/verify')
        .set('Authorization', `Bearer ${token}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('验证成功');
      expect(res.body.user).toBeDefined();
    });

    it('should return error for invalid token', async () => {
      const res = await request(app)
        .get('/api/auth/verify')
        .set('Authorization', 'Bearer invalid-token');
      expect(res.statusCode).toBe(401);
      expect(res.body.error).toBe('无效的认证令牌');
    });

    it('should return error for missing token', async () => {
      const res = await request(app)
        .get('/api/auth/verify');
      expect(res.statusCode).toBe(401);
      expect(res.body.error).toBe('未提供认证令牌');
    });
  });
});