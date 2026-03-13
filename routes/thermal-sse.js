var express = require('express');
var router = express.Router();
var db = require('../db');

// 从数据库获取热成像数据
function getThermalDataFromDatabase() {
  return new Promise((resolve, reject) => {
    const sql = `SELECT * FROM thermal_imaging_sensor ORDER BY collect_time DESC LIMIT 1`;
    
    db.query(sql, function(error, results) {
      if (error) {
        console.error('数据库查询失败:', error);
        reject(error);
        return;
      }
      
      if (results.length === 0) {
        // 如果没有数据，生成模拟数据
        resolve(generateFallbackData());
        return;
      }
      
      const record = results[0];
      
      // 处理max_temp字段（JSON类型）
      let maxTempData = null;
      try {
        maxTempData = typeof record.max_temp === 'string' ? JSON.parse(record.max_temp) : record.max_temp;
      } catch (parseError) {
        // 如果解析失败，生成默认的温度矩阵
        maxTempData = generateDefaultMatrix();
      }
      
      // 映射火灾风险级别
      const fireRiskMap = {
        0: 'low',
        1: 'medium',
        2: 'high',
        3: 'critical'
      };
      
      // 映射环境状态
      const envStatusMap = {
        0: 'normal',
        1: 'warning',
        2: 'alert',
        3: 'emergency'
      };
      
      const processedData = {
        sensorType: 'FLIR Thermal Camera', // 表中没有sensor_type字段
        timestamp: record.collect_time ? new Date(record.collect_time).toISOString() : new Date().toISOString(),
        temperature: record.temperature || 35.0,
        humidity: record.humidity || 50.0,
        smokeLevel: record.smoke_level || 0,
        fireRisk: fireRiskMap[record.fire_risk] || 'low',
        envStatus: envStatusMap[record.env_status] || 'normal',
        battery: record.battery || 100,
        humanDetected: record.human_detected === 1 || record.human_detected === true,
        maxTemp: maxTempData || generateDefaultMatrix()
      };
      
      resolve(processedData);
    });
  });
}

// // 生成 fallback 数据（当数据库无数据时使用）
// function generateFallbackData() {
//   const matrix = generateDefaultMatrix();
  
//   return {
//     sensorType: 'FLIR Thermal Camera',
//     timestamp: new Date().toISOString(),
//     temperature: 35.5,
//     humidity: 50.0,
//     smokeLevel: 0,
//     fireRisk: 'low',
//     envStatus: 'normal',
//     battery: 100,
//     humanDetected: false,
//     maxTemp: matrix
//   };
// }

// // 生成默认的温度矩阵
// function generateDefaultMatrix() {
//   const matrix = [];
//   let min = 30;
//   let max = 30;
//   let sum = 0;
//   let count = 0;
  
//   for (let i = 0; i < 8; i++) {
//     const row = [];
//     for (let j = 0; j < 8; j++) {
//       const temp = Math.round((30 + Math.random() * 5) * 10) / 10;
//       row.push(temp);
//       sum += temp;
//       count++;
//       if (temp < min) min = temp;
//       if (temp > max) max = temp;
//     }
//     matrix.push(row);
//   }
  
//   const avg = Math.round((sum / count) * 10) / 10;
  
//   return {
//     matrix: matrix,
//     metadata: {
//       min: min,
//       max: max,
//       avg: avg
//     }
//   };
// }

// SSE 流端点
router.get('/stream', function(req, res) {
  // 设置 SSE 响应头
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  // 发送连接成功状态
  res.write('event: message\n');
  res.write(`data: ${JSON.stringify({ type: 'status', status: 'connected', message: 'SSE 连接已建立', timestamp: new Date().toISOString() })}\n\n`);
  
  // 定期发送心跳
  const heartbeatInterval = setInterval(() => {
    res.write('event: message\n');
    res.write(`data: ${JSON.stringify({ type: 'heartbeat', timestamp: new Date().toISOString() })}\n\n`);
  }, 30000); // 每30秒发送一次心跳
  
  // 定期发送热成像数据
  const dataInterval = setInterval(async () => {
    try {
      const data = await getThermalDataFromDatabase();
      res.write('event: message\n');
      res.write(`data: ${JSON.stringify({ type: 'data', data: data })}\n\n`);
    } catch (error) {
      console.error('获取热成像数据失败:', error);
      // 发送错误状态
      res.write('event: message\n');
      res.write(`data: ${JSON.stringify({ type: 'status', status: 'error', message: '数据获取失败', timestamp: new Date().toISOString() })}\n\n`);
    }
  }, 2000); // 每2秒发送一次数据
  
  // 处理客户端断开连接
  req.on('close', () => {
    clearInterval(heartbeatInterval);
    clearInterval(dataInterval);
    res.end();
  });
});

module.exports = router;