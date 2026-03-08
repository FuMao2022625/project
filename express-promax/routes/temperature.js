/**
 * 温度数据路由模块
 * 功能：提供实时温度数据的SSE流
 * 作者：系统生成
 * 创建日期：2024-01-01
 * 主要修改记录：
 * 2024-01-01 - 初始化文件
 */

// 导入依赖模块
var express = require('express');
var router = express.Router();

/**
 * 模拟温度数据生成函数
 * 功能：生成20-30之间的随机温度
 * @returns {string} - 生成的温度值（保留1位小数）
 */
function generateTemperature() {
  // 生成20-30之间的随机温度
  return (20 + Math.random() * 10).toFixed(1);
}

/**
 * SSE温度数据流路由
 * @route GET /temperature/stream
 * @description 提供实时温度数据的SSE流
 * @returns {EventStream} - SSE流，包含temperature和heartbeat事件
 */
router.get('/stream', function(req, res, next) {
  // 设置SSE响应头
  res.setHeader('Content-Type', 'text/event-stream'); // SSE内容类型
  res.setHeader('Cache-Control', 'no-cache'); // 禁用缓存
  res.setHeader('Connection', 'keep-alive'); // 保持连接
  res.setHeader('X-Accel-Buffering', 'no'); // 禁用Nginx缓冲
  
  // 发送初始数据
  res.write(`event: temperature\ndata: ${JSON.stringify({ temperature: generateTemperature(), timestamp: new Date().toISOString() })}\n\n`);
  
  // 心跳间隔（30秒）
  const heartbeatInterval = setInterval(() => {
    try {
      res.write(`event: heartbeat\ndata: ${new Date().toISOString()}\n\n`);
    } catch (error) {
      // 发生错误时清理定时器
      clearInterval(heartbeatInterval);
      clearInterval(temperatureInterval);
    }
  }, 30000);
  
  // 温度数据发送间隔（2秒）
  const temperatureInterval = setInterval(() => {
    try {
      const temperature = generateTemperature();
      res.write(`event: temperature\ndata: ${JSON.stringify({ temperature, timestamp: new Date().toISOString() })}\n\n`);
    } catch (error) {
      // 发生错误时清理定时器
      clearInterval(heartbeatInterval);
      clearInterval(temperatureInterval);
    }
  }, 2000);
  
  // 处理客户端断开连接
  req.on('close', () => {
    console.log('客户端断开SSE连接');
    // 清理定时器
    clearInterval(heartbeatInterval);
    clearInterval(temperatureInterval);
    res.end();
  });
});

// 导出路由模块
module.exports = router;