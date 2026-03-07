var express = require('express');
var router = express.Router();
const { pool } = require('../db');

// 模拟热成像数据生成函数
function generateThermalData() {
  const data = [];
  // 生成20x20的热成像数据
  for (let y = 0; y < 20; y++) {
    for (let x = 0; x < 20; x++) {
      // 生成20-40°C之间的随机温度
      const temperature = (20 + Math.random() * 20).toFixed(2);
      data.push({ x, y, temperature });
    }
  }
  return data;
}

// 压缩数据的简单实现
function compressData(data) {
  try {
    // 这里使用JSON.stringify作为基础压缩，实际项目中可以使用更高效的压缩算法
    return JSON.stringify(data);
  } catch (error) {
    console.error('数据压缩失败:', error);
    return null;
  }
}

// SSE路由 - 实时推送热成像数据
router.get('/stream', async function(req, res, next) {
  // 设置SSE响应头
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // 禁用Nginx缓冲
  
  // 连接状态
  let isConnected = true;
  
  // 传输速率控制
  let transmissionRate = 1000; // 默认1秒
  
  // 心跳间隔（30秒）
  const heartbeatInterval = setInterval(() => {
    try {
      if (isConnected) {
        res.write(`event: heartbeat\ndata: ${JSON.stringify({ timestamp: new Date().toISOString() })}\n\n`);
      }
    } catch (error) {
      console.error('发送心跳失败:', error);
      isConnected = false;
      clearInterval(heartbeatInterval);
      clearInterval(dataInterval);
    }
  }, 30000);
  
  // 数据发送间隔
  const dataInterval = setInterval(async () => {
    try {
      if (!isConnected) return;
      
      // 从数据库获取最新的热成像数据
      let thermalData;
      try {
        const [rows] = await pool.query(
          'SELECT * FROM thermal_images ORDER BY captured_at DESC LIMIT 1'
        );
        
        if (rows.length > 0) {
          thermalData = JSON.parse(rows[0].temperature_data);
        } else {
          // 如果数据库中没有数据，生成模拟数据
          thermalData = generateThermalData();
        }
      } catch (dbError) {
        console.error('获取热成像数据失败:', dbError);
        // 生成模拟数据作为备用
        thermalData = generateThermalData();
      }
      
      // 压缩数据
      const compressedData = compressData(thermalData);
      
      if (compressedData) {
        // 发送热成像数据
        res.write(`event: thermal_data\ndata: ${compressedData}\n\n`);
      }
    } catch (error) {
      console.error('发送热成像数据失败:', error);
      isConnected = false;
      clearInterval(heartbeatInterval);
      clearInterval(dataInterval);
    }
  }, transmissionRate);
  
  // 处理客户端断开连接
  req.on('close', () => {
    console.log('客户端断开SSE连接');
    isConnected = false;
    clearInterval(heartbeatInterval);
    clearInterval(dataInterval);
    res.end();
  });
  
  // 处理错误
  req.on('error', (error) => {
    console.error('SSE连接错误:', error);
    isConnected = false;
    clearInterval(heartbeatInterval);
    clearInterval(dataInterval);
    res.end();
  });
});

// 获取热成像历史数据的API
router.get('/history', async function(req, res, next) {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const [rows] = await pool.query(
      'SELECT * FROM thermal_images ORDER BY captured_at DESC LIMIT ?',
      [limit]
    );
    
    res.json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error('获取热成像历史数据失败:', error);
    res.status(500).json({
      success: false,
      error: '获取热成像历史数据失败'
    });
  }
});

module.exports = router;