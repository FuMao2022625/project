const express = require('express');
const temperatureService = require('../services/temperatureService');
const router = express.Router();

// 存储活跃的SSE连接
const activeConnections = new Map();
const MAX_CONNECTIONS = 100; // 最大连接数限制
const CONNECTION_TIMEOUT = 5 * 60 * 1000; // 5分钟连接超时

// 定期清理过期连接
setInterval(() => {
  const now = Date.now();
  for (const [connectionId, connection] of activeConnections.entries()) {
    if (now - connection.lastActivity > CONNECTION_TIMEOUT) {
      console.log(`清理过期连接: ${connectionId}`);
      connection.cleanup();
    }
  }
}, 60000); // 每分钟检查一次

// SSE端点 - 温度数据流
router.get('/temperature/stream', (req, res) => {
  // 防止内存泄漏：限制最大连接数
  if (activeConnections.size >= MAX_CONNECTIONS) {
    console.warn(`达到最大连接数限制 (${MAX_CONNECTIONS})，拒绝新连接`);
    return res.status(503).json({
      success: false,
      error: '服务器繁忙，请稍后重试'
    });
  }

  // 设置SSE响应头
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control',
    'X-Accel-Buffering': 'no' // 禁用Nginx缓冲
  });

  // 生成连接ID
  const connectionId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
  
  // 发送初始连接确认
  res.write(`event: connected\ndata: {"connectionId": "${connectionId}", "status": "connected"}\n\n`);

  // 创建温度数据监听器
  const temperatureListener = (data) => {
    try {
      // 更新最后活动时间
      if (activeConnections.has(connectionId)) {
        activeConnections.get(connectionId).lastActivity = Date.now();
      }
      
      // 格式化SSE数据
      const sseData = `event: temperature\ndata: ${JSON.stringify(data)}\n\n`;
      res.write(sseData);
    } catch (error) {
      console.error(`SSE写入错误 (连接 ${connectionId}):`, error);
      // 如果写入失败，关闭连接
      cleanupConnection();
    }
  };

  // 心跳机制 - 每30秒发送一次保持连接
  const heartbeatInterval = setInterval(() => {
    try {
      res.write('event: heartbeat\ndata: {"type": "ping"}\n\n');
    } catch (error) {
      console.error(`心跳发送失败 (连接 ${connectionId}):`, error);
      cleanupConnection();
    }
  }, 30000);

  // 清理连接函数
  const cleanupConnection = () => {
    console.log(`清理SSE连接: ${connectionId}`);
    
    // 清除心跳定时器
    if (heartbeatInterval) {
      clearInterval(heartbeatInterval);
    }
    
    // 从温度服务中移除监听器
    temperatureService.removeListener(temperatureListener);
    
    // 从活跃连接中移除
    activeConnections.delete(connectionId);
    
    // 结束响应
    try {
      res.end();
    } catch (error) {
      console.error(`响应结束错误 (连接 ${connectionId}):`, error);
    }
  };

  // 监听客户端断开连接
  req.on('close', () => {
    console.log(`客户端断开连接: ${connectionId}`);
    cleanupConnection();
  });

  req.on('error', (error) => {
    console.error(`客户端连接错误 (连接 ${connectionId}):`, error);
    cleanupConnection();
  });

  // 将连接信息存储到活跃连接映射中
  activeConnections.set(connectionId, {
    connectionId,
    startTime: new Date().toISOString(),
    lastActivity: Date.now(),
    remoteAddress: req.ip || req.connection.remoteAddress,
    userAgent: req.headers['user-agent'],
    cleanup: cleanupConnection
  });

  // 添加温度监听器
  const listenerAdded = temperatureService.addListener(temperatureListener);
  if (!listenerAdded) {
    console.warn(`无法添加温度监听器，连接 ${connectionId} 将被关闭`);
    cleanupConnection();
    return;
  }

  // 发送当前温度数据
  const currentTemp = temperatureService.getCurrentTemperature();
  res.write(`event: temperature\ndata: ${JSON.stringify(currentTemp)}\n\n`);

  console.log(`新的SSE连接建立: ${connectionId}`);
});

// 获取SSE连接状态
router.get('/temperature/connections', (req, res) => {
  const connections = Array.from(activeConnections.values()).map(conn => ({
    connectionId: conn.connectionId,
    startTime: conn.startTime,
    remoteAddress: conn.remoteAddress,
    userAgent: conn.userAgent
  }));

  res.json({
    success: true,
    data: {
      totalConnections: connections.length,
      connections: connections
    }
  });
});

// 温度采集控制端点
router.post('/temperature/control/start', (req, res) => {
  try {
    const { interval = 2000 } = req.body;
    
    if (temperatureService.getCollectionStatus().isCollecting) {
      return res.json({
        success: false,
        message: '温度采集已在运行中'
      });
    }

    temperatureService.startCollection(interval);
    
    res.json({
      success: true,
      message: '温度采集已启动',
      data: {
        interval: interval,
        unit: 'ms'
      }
    });
  } catch (error) {
    console.error('启动温度采集错误:', error);
    res.status(500).json({
      success: false,
      error: '启动温度采集失败'
    });
  }
});

router.post('/temperature/control/stop', (req, res) => {
  try {
    temperatureService.stopCollection();
    
    res.json({
      success: true,
      message: '温度采集已停止'
    });
  } catch (error) {
    console.error('停止温度采集错误:', error);
    res.status(500).json({
      success: false,
      error: '停止温度采集失败'
    });
  }
});

// 获取温度采集状态
router.get('/temperature/status', (req, res) => {
  try {
    const status = temperatureService.getCollectionStatus();
    
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('获取温度状态错误:', error);
    res.status(500).json({
      success: false,
      error: '获取温度状态失败'
    });
  }
});

// 设置温度范围
router.post('/temperature/config/range', (req, res) => {
  try {
    const { min, max } = req.body;
    
    if (typeof min !== 'number' || typeof max !== 'number') {
      return res.status(400).json({
        success: false,
        error: '温度范围必须是数字'
      });
    }

    if (min >= max) {
      return res.status(400).json({
        success: false,
        error: '最小温度必须小于最大温度'
      });
    }

    temperatureService.setTemperatureRange(min, max);
    
    res.json({
      success: true,
      message: '温度范围已设置',
      data: {
        min: min,
        max: max
      }
    });
  } catch (error) {
    console.error('设置温度范围错误:', error);
    res.status(500).json({
      success: false,
      error: '设置温度范围失败'
    });
  }
});

// 重置温度
router.post('/temperature/control/reset', (req, res) => {
  try {
    temperatureService.resetTemperature();
    
    res.json({
      success: true,
      message: '温度已重置到默认值'
    });
  } catch (error) {
    console.error('重置温度错误:', error);
    res.status(500).json({
      success: false,
      error: '重置温度失败'
    });
  }
});

module.exports = router;