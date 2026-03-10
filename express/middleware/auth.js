const jwt = require('jsonwebtoken');

// JWT令牌验证中间件
const auth = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: '未提供认证令牌' });
  }

  try {
    const decoded = jwt.verify(token, 'secret_key'); // 实际应用中应使用环境变量存储密钥
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: '无效的认证令牌' });
  }
};

module.exports = auth;