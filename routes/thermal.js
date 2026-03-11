var express = require('express');
var router = express.Router();
var mysql = require('mysql');

// 数据库连接
var connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '12305',
  database: 'express'
});

// 生成模拟热成像数据
function generateThermalData() {
  // 生成10x10的温度矩阵
  const matrix = [];
  for (let i = 0; i < 10; i++) {
    const row = [];
    for (let j = 0; j < 10; j++) {
      // 基础温度20-30度，加上一些随机波动
      const baseTemp = 20 + Math.random() * 10;
      // 模拟人体温度区域
      if (i > 3 && i < 7 && j > 3 && j < 7) {
        row.push((baseTemp + 5 + Math.random() * 3).toFixed(2));
      } else {
        row.push(baseTemp.toFixed(2));
      }
    }
    matrix.push(row);
  }
  
  return {
    deviceId: 'THERMAL-001',
    timestamp: new Date().toISOString(),
    matrix: matrix,
    maxTemp: (35 + Math.random() * 2).toFixed(2),
    minTemp: (18 + Math.random() * 2).toFixed(2),
    avgTemp: (25 + Math.random() * 2).toFixed(2)
  };
}

// SSE端点
router.get('/thermal-stream', function(req, res, next) {
  // 设置SSE响应头
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  // 发送初始数据
  const initialData = generateThermalData();
  res.write(`data: ${JSON.stringify(initialData)}

`);
  
  // 定期发送数据
  const interval = setInterval(() => {
    try {
      const data = generateThermalData();
      res.write(`data: ${JSON.stringify(data)}

`);
    } catch (error) {
      console.error('SSE发送错误:', error);
      clearInterval(interval);
      res.end();
    }
  }, 500); // 每500ms发送一次数据
  
  // 处理连接关闭
  req.on('close', () => {
    clearInterval(interval);
    console.log('SSE连接已关闭');
  });
});

// 获取最新热成像数据
router.get('/latest-thermal', function(req, res, next) {
  const data = generateThermalData();
  res.json(data);
});

module.exports = router;
