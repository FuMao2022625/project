const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/user');

// 注册处理函数
exports.register = async (req, res) => {
  // 验证请求数据
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { username, email, password } = req.body;

  try {
    // 检查用户名是否已存在
    const existingUsername = await new Promise((resolve, reject) => {
      User.findByUsername(username, (err, results) => {
        if (err) reject(err);
        resolve(results[0]);
      });
    });
    if (existingUsername) {
      return res.status(400).json({ errors: [{ msg: '用户名已存在' }] });
    }

    // 检查邮箱是否已存在
    const existingEmail = await new Promise((resolve, reject) => {
      User.findByEmail(email, (err, results) => {
        if (err) reject(err);
        resolve(results[0]);
      });
    });
    if (existingEmail) {
      return res.status(400).json({ errors: [{ msg: '电子邮箱已被注册' }] });
    }

    // 哈希密码
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 创建用户
    User.create(username, email, hashedPassword, (err, result) => {
      if (err) {
        console.error('Error creating user:', err);
        return res.status(500).json({ error: '注册失败，请稍后重试' });
      }
      res.status(201).json({ message: '注册成功' });
    });
  } catch (err) {
    console.error('Error during registration:', err);
    res.status(500).json({ error: '注册失败，请稍后重试' });
  }
};

// 登录处理函数
exports.login = (req, res) => {
  // 验证请求数据
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  // 查找用户
  User.findByEmail(email, async (err, results) => {
    if (err) {
      console.error('Error finding user:', err);
      return res.status(500).json({ error: '登录失败，请稍后重试' });
    }

    if (results.length === 0) {
      return res.status(401).json({ error: '电子邮箱或密码错误' });
    }

    const user = results[0];

    try {
      // 验证密码
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ error: '电子邮箱或密码错误' });
      }

      // 生成JWT令牌
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        'secret_key', // 实际应用中应使用环境变量存储密钥
        { expiresIn: '1h' }
      );

      res.status(200).json({ message: '登录成功', token });
    } catch (err) {
      console.error('Error during login:', err);
      res.status(500).json({ error: '登录失败，请稍后重试' });
    }
  });
};

// 验证用户是否已登录
exports.verify = (req, res) => {
  res.status(200).json({ message: '验证成功', user: req.user });
};