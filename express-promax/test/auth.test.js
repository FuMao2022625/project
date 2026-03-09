/**
 * 认证功能测试
 * 测试认证相关的工具函数和API接口
 */
const { generateToken, verifyToken, hashPassword, verifyPassword } = require('../utils/auth');

// 测试JWT令牌生成和验证
describe('JWT Token Tests', () => {
  test('should generate a valid token', () => {
    const user = { id: 1, username: 'testuser', email: 'test@example.com' };
    const token = generateToken(user);
    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThan(0);
  });

  test('should verify a valid token', () => {
    const user = { id: 1, username: 'testuser', email: 'test@example.com' };
    const token = generateToken(user);
    const decoded = verifyToken(token);
    expect(decoded.id).toBe(user.id);
    expect(decoded.username).toBe(user.username);
    expect(decoded.email).toBe(user.email);
  });

  test('should throw error for invalid token', () => {
    expect(() => {
      verifyToken('invalid-token');
    }).toThrow('无效的令牌');
  });
});

// 测试密码加密和验证
describe('Password Tests', () => {
  test('should hash a password', async () => {
    const password = 'password123';
    const hashedPassword = await hashPassword(password);
    expect(typeof hashedPassword).toBe('string');
    expect(hashedPassword.length).toBeGreaterThan(0);
    expect(hashedPassword).not.toBe(password);
  });

  test('should verify a correct password', async () => {
    const password = 'password123';
    const hashedPassword = await hashPassword(password);
    const isMatch = await verifyPassword(password, hashedPassword);
    expect(isMatch).toBe(true);
  });

  test('should reject an incorrect password', async () => {
    const password = 'password123';
    const wrongPassword = 'wrongpassword';
    const hashedPassword = await hashPassword(password);
    const isMatch = await verifyPassword(wrongPassword, hashedPassword);
    expect(isMatch).toBe(false);
  });
});
