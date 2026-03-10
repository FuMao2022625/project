const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');

// 注册验证规则
const registerValidationRules = [
  body('username')
    .isLength({ min: 6, max: 20 })
    .withMessage('用户名长度必须在6-20个字符之间')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('用户名只能包含字母、数字和下划线'),
  body('email')
    .isEmail()
    .withMessage('请输入有效的电子邮箱地址'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('密码长度必须至少为8位')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]$/)
    .withMessage('密码必须包含大小写字母、数字和特殊符号')
];

// 登录验证规则
const loginValidationRules = [
  body('email').isEmail().withMessage('请输入有效的电子邮箱地址'),
  body('password').notEmpty().withMessage('请输入密码')
];

// 注册路由
router.post('/register', registerValidationRules, authController.register);

// 登录路由
router.post('/login', loginValidationRules, authController.login);

// 验证路由
router.get('/verify', auth, authController.verify);

module.exports = router;