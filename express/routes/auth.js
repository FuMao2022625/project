const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const authMiddleware = require('../middlewares/auth.middleware');

/**
 * @route POST /api/auth/register
 * @desc 用户注册
 * @access Public
 * @body {string} username - 用户名（必填，3-50 字符，只能包含字母、数字和下划线）
 * @body {string} password - 密码（必填，至少 6 个字符）
 * @body {string} real_name - 真实姓名（可选，最多 50 字符）
 * @body {string} phone - 手机号（可选，中国大陆 11 位手机号）
 * @body {number} dept_id - 部门 ID（可选）
 * @returns {object} 201 - 注册成功响应
 * @returns {object} 400 - 验证失败
 * @returns {object} 409 - 用户已存在
 * @returns {object} 500 - 服务器错误
 */
router.post('/register', async (req, res) => {
  await authController.register(req, res);
});

/**
 * @route POST /api/auth/login
 * @desc 用户登录
 * @access Public
 * @body {string} identifier - 用户名或邮箱（必填）
 * @body {string} password - 密码（必填）
 * @returns {object} 200 - 登录成功响应
 * @returns {object} 400 - 请求参数错误
 * @returns {object} 401 - 用户名或密码错误
 * @returns {object} 403 - 账户被禁用
 * @returns {object} 500 - 服务器错误
 */
router.post('/login', async (req, res) => {
  await authController.login(req, res);
});

/**
 * @route GET /api/auth/profile
 * @desc 获取当前登录用户信息
 * @access Private
 * @header {string} Authorization - Bearer {token}
 * @returns {object} 200 - 获取成功响应
 * @returns {object} 401 - 未授权
 * @returns {object} 500 - 服务器错误
 */
router.get('/profile', authMiddleware, async (req, res) => {
  await authController.getProfile(req, res);
});

module.exports = router;
