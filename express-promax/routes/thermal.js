/**
 * 热成像数据路由模块
 * 功能：提供热成像数据的SSE流和历史数据查询
 * 作者：系统生成
 * 创建日期：2024-01-01
 * 主要修改记录：
 * 2024-01-01 - 初始化文件
 * 2026-03-09 - 性能优化和代码重构
 */

// 导入依赖模块
const express = require('express');
const router = express.Router();
const { pool } = require('../db'); // 数据库连接池

// 缓存最新的热成像数据
let cachedThermalData = null;
let lastDataTimestamp = 0;
const CACHE_DURATION = 5000; // 缓存5秒

/**
 * 模拟热成像数据生成函数
 * 功能：生成20x20的热成像数据
 * @returns {Array} - 热成像数据数组，包含x、y坐标和温度值
 */
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

/**
 * 压缩数据的简单实现
 * 功能：将数据压缩为JSON字符串
 * @param {any} data - 要压缩的数据
 * @returns {string|null} - 压缩后的数据，失败时返回null
 */
function compressData(data) {
  try {
    // 这里使用JSON.stringify作为基础压缩，实际项目中可以使用更高效的压缩算法
    return JSON.stringify(data);
  } catch (error) {
    console.error('数据压缩失败:', error);
    return null;
  }
}

/**
 * 从数据库获取最新的热成像数据
 * @returns {Promise<Array>} - 热成像数据数组
 */
async function getLatestThermalData() {
  // 检查缓存是否有效
  const now = Date.now();
  if (cachedThermalData && (now - lastDataTimestamp) < CACHE_DURATION) {
    return cachedThermalData;
  }
  
  try {
    // 只选择需要的字段，提高查询性能
    const [rows] = await pool.query(
      'SELECT temperature_data FROM thermal_images ORDER BY captured_at DESC LIMIT 1'
    );
    
    let thermalData;
    if (rows.length > 0) {
      thermalData = JSON.parse(rows[0].temperature_data);
      // 更新缓存
      cachedThermalData = thermalData;
      lastDataTimestamp = now;
    } else {
      // 如果数据库中没有数据，生成模拟数据
      thermalData = generateThermalData();
    }
    return thermalData;
  } catch (dbError) {
    console.error('获取热成像数据失败:', dbError);
    // 生成模拟数据作为备用
    return generateThermalData();
  }
}

/**
 * SSE热成像数据流路由
 * @route GET /thermal/stream
 * @description 提供实时热成像数据的SSE流
 * @returns {EventStream} - SSE流，包含thermal_data和heartbeat事件
 */
router.get('/stream', async function(req, res, next) {
  // 设置SSE响应头
  res.setHeader('Content-Type', 'text/event-stream'); // SSE内容类型
  res.setHeader('Cache-Control', 'no-cache'); // 禁用缓存
  res.setHeader('Connection', 'keep-alive'); // 保持连接
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
      
      // 从数据库获取最新的热成像数据（带缓存）
      const thermalData = await getLatestThermalData();
      
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

/**
 * 获取热成像历史数据
 * @route GET /thermal/history
 * @description 获取热成像历史数据
 * @param {number} limit - 限制返回数量（默认10）
 * @returns {object} 200 - 返回热成像历史数据
 * @returns {object} 500 - 获取失败
 */
router.get('/history', async function(req, res, next) {
  try {
    const limit = parseInt(req.query.limit) || 10;
    // 只选择需要的字段，提高查询性能
    const [rows] = await pool.query(
      'SELECT id, image_id, robot_id, captured_at, image_path FROM thermal_images ORDER BY captured_at DESC LIMIT ?',
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

// 导出路由模块
module.exports = router;