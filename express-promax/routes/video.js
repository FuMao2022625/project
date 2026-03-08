/**
 * 视频流路由模块
 * 功能：提供视频流页面访问
 * 作者：系统生成
 * 创建日期：2024-01-01
 * 主要修改记录：
 * 2024-01-01 - 初始化文件
 */

// 导入依赖模块
var express = require('express');
var router = express.Router();

/**
 * 视频流页面路由
 * @route GET /video/stream
 * @description 提供视频流页面访问
 * @returns {file} - 返回video.html文件
 */
router.get('/stream', function(req, res, next) {
  res.sendFile('video.html', { root: 'public' });
});

// 导出路由模块
module.exports = router;