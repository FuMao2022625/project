const authService = require('../services/auth.service');
const { pool } = require('../config/database');

async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: '未提供认证令牌'
      });
    }

    const parts = authHeader.split(' ');

    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(401).json({
        success: false,
        message: '令牌格式错误，应为 Bearer {token}'
      });
    }

    const token = parts[1];
    const decoded = authService.verifyToken(token);

    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: '令牌无效或已过期'
      });
    }

    const sql = `
      SELECT user_id, username, real_name, phone, dept_id, status
      FROM sys_user
      WHERE user_id = ?
    `;
    
    const [rows] = await pool.query(sql, [decoded.user_id]);

    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: '用户不存在'
      });
    }

    const user = rows[0];

    if (user.status !== 1) {
      return res.status(403).json({
        success: false,
        message: '账户已被禁用'
      });
    }

    req.user = user;
    next();

  } catch (error) {
    console.error('认证中间件错误:', error);
    return res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

module.exports = authMiddleware;
