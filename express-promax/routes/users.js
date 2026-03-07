var express = require('express');
var router = express.Router();
var authMiddleware = require('../middleware/auth');

/* 获取当前用户信息（需要认证） */
router.get('/me', authMiddleware, function(req, res, next) {
  res.json({
    success: true,
    data: req.user
  });
});

module.exports = router;
