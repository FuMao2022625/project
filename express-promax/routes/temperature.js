var express = require('express');
var router = express.Router();

// 模拟温度数据生成函数
function generateTemperature() {
  // 生成20-30之间的随机温度
  return (20 + Math.random() * 10).toFixed(1);
}

// SSE路由
router.get('/stream', function(req, res, next) {
  // 设置SSE响应头
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // 禁用Nginx缓冲
  
  // 发送初始数据
  res.write(`event: temperature\ndata: ${JSON.stringify({ temperature: generateTemperature(), timestamp: new Date().toISOString() })}\n\n`);
  
  // 心跳间隔（30秒）
  const heartbeatInterval = setInterval(() => {
    try {
      res.write(`event: heartbeat\ndata: ${new Date().toISOString()}\n\n`);
    } catch (error) {
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
      clearInterval(heartbeatInterval);
      clearInterval(temperatureInterval);
    }
  }, 2000);
  
  // 处理客户端断开连接
  req.on('close', () => {
    console.log('客户端断开SSE连接');
    clearInterval(heartbeatInterval);
    clearInterval(temperatureInterval);
    res.end();
  });
});

module.exports = router;