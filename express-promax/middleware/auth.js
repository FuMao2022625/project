/**
 * 认证中间件
 * 功能：验证JWT令牌，保护需要认证的路由
 * 作者：系统生成
 * 创建日期：2024-01-01
 * 主要修改记录：
 * 2024-01-01 - 初始化文件
 */

const jwt = require('jsonwebtoken');

// JWT密钥，建议在生产环境中通过环境变量设置
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

/**
 * JWT验证中间件
 * 功能：验证请求中的JWT令牌，确保用户已认证
 * @param {object} req - Express请求对象
 * @param {object} res - Express响应对象
 * @param {function} next - Express下一步函数
 * @returns {void} - 验证通过时调用next()，失败时返回401错误
 */
const authMiddleware = (req, res, next) => {
  // 从请求头获取token
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ 
      success: false, 
      error: '未提供认证令牌' 
    });
  }

  // 提取token
  const token = authHeader.split(' ')[1];

  try {
    // 验证token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // 将用户信息添加到请求对象中
    req.user = decoded;
    
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        error: '令牌已过期' 
      });
    }
    return res.status(401).json({ 
      success: false, 
      error: '无效的认证令牌' 
    });
  }
};

// 导出中间件
module.exports = authMiddleware;