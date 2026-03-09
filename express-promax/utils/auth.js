/**
 * 认证相关工具函数
 * 功能：提供JWT令牌生成、验证和密码加密验证功能
 * 作者：系统生成
 * 创建日期：2024-01-01
 * 主要修改记录：
 * 2024-01-01 - 初始化文件
 * 2026-03-09 - 安全加固和性能优化
 */
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

// JWT密钥，必须在生产环境中通过环境变量设置
let JWT_SECRET = process.env.JWT_SECRET;

// 确保JWT密钥存在
if (!JWT_SECRET) {
  console.warn('JWT_SECRET环境变量未设置，使用默认密钥。生产环境中请务必设置安全的JWT_SECRET！');
  // 生成一个随机的默认密钥，仅用于开发环境
  const crypto = require('crypto');
  JWT_SECRET = crypto.randomBytes(32).toString('hex');
}

/**
 * 生成JWT令牌
 * @param {object} payload - 令牌载荷，包含用户信息
 * @param {string} expiresIn - 过期时间，默认7天
 * @returns {string} JWT令牌
 */
exports.generateToken = (payload, expiresIn = '7d') => {
  // 移除敏感信息
  const safePayload = {
    id: payload.id,
    username: payload.username,
    email: payload.email
  };
  
  return jwt.sign(safePayload, JWT_SECRET, { expiresIn });
};

/**
 * 验证JWT令牌
 * @param {string} token - JWT令牌
 * @returns {object} 解码后的令牌载荷
 */
exports.verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('令牌已过期');
    } else if (error.name === 'JsonWebTokenError') {
      throw new Error('无效的令牌');
    }
    throw new Error('令牌验证失败');
  }
};

/**
 * 密码加密
 * @param {string} password - 原始密码
 * @param {number} saltRounds - 加密强度，默认12
 * @returns {Promise<string>} 加密后的密码
 */
exports.hashPassword = async (password, saltRounds = 12) => {
  return await bcrypt.hash(password, saltRounds);
};

/**
 * 验证密码
 * @param {string} password - 原始密码
 * @param {string} hashedPassword - 加密后的密码
 * @returns {Promise<boolean>} 密码是否匹配
 */
exports.verifyPassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};