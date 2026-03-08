/**
 * Socket通信路由模块
 * 功能：实现基于Socket通信的嵌入式设备数据接收系统
 * 作者：系统生成
 * 创建日期：2026-03-07
 * 主要修改记录：
 * 2026-03-07 - 初始化文件
 */

// 导入依赖模块
var express = require('express');
var router = express.Router();
const net = require('net'); // Socket服务器
const fs = require('fs'); // 文件系统
const path = require('path'); // 路径处理
const { pool } = require('../db'); // 数据库连接池

/**
 * Socket服务器配置
 * 包含端口、超时时间、最大连接数等配置
 */
const SOCKET_CONFIG = {
  port: process.env.SOCKET_PORT || 8080, // 监听端口
  connectionTimeout: 30000, // 连接超时时间（30秒）
  maxConnections: 100, // 最大连接数
  bufferSize: 1024 * 1024, // 缓冲区大小（1MB）
  storagePath: path.join(__dirname, '../data'), // 数据存储路径
  logPath: path.join(__dirname, '../logs') // 日志存储路径
};

// 设备连接管理
const connections = new Map(); // 存储所有连接
const devices = new Map(); // 存储已认证的设备
let server = null; // Socket服务器实例
let connectionCount = 0; // 当前连接数

/**
 * 确保目录存在
 * 功能：检查并创建必要的目录结构
 */
function ensureDirectories() {
  if (!fs.existsSync(SOCKET_CONFIG.storagePath)) {
    fs.mkdirSync(SOCKET_CONFIG.storagePath, { recursive: true });
  }
  if (!fs.existsSync(SOCKET_CONFIG.logPath)) {
    fs.mkdirSync(SOCKET_CONFIG.logPath, { recursive: true });
  }
}

/**
 * 初始化Socket服务器
 * 功能：创建并启动Socket服务器，处理连接事件
 */
function initSocketServer() {
  ensureDirectories();
  
  server = net.createServer((socket) => {
    const clientId = `${socket.remoteAddress}:${socket.remotePort}`;
    connectionCount++;
    
    console.log(`新的客户端连接: ${clientId}`);
    
    // 设置连接超时
    socket.setTimeout(SOCKET_CONFIG.connectionTimeout);
    
    // 存储连接信息
    connections.set(clientId, {
      socket,
      connectedAt: new Date(),
      lastActivity: new Date(),
      buffer: '',
      deviceId: null,
      authenticated: false
    });
    
    // 处理数据接收
    socket.on('data', (data) => {
      handleData(clientId, data);
    });
    
    // 处理连接关闭
    socket.on('close', () => {
      handleDisconnect(clientId);
    });
    
    // 处理错误
    socket.on('error', (error) => {
      handleError(clientId, error);
    });
    
    // 处理超时
    socket.on('timeout', () => {
      console.log(`连接超时: ${clientId}`);
      socket.end();
    });
  });
  
  // 启动服务器
  server.listen(SOCKET_CONFIG.port, () => {
    console.log(`Socket服务器已启动，监听端口 ${SOCKET_CONFIG.port}`);
  });
  
  // 处理服务器错误
  server.on('error', (error) => {
    console.error('Socket服务器错误:', error);
  });
}

/**
 * 处理数据接收
 * 功能：接收并处理客户端发送的数据
 * @param {string} clientId - 客户端ID
 * @param {Buffer} data - 接收到的数据
 */
function handleData(clientId, data) {
  const connection = connections.get(clientId);
  if (!connection) return;
  
  connection.lastActivity = new Date();
  connection.buffer += data.toString();
  
  // 尝试解析数据帧
  parseDataFrame(clientId, connection.buffer);
}

/**
 * 解析数据帧
 * 功能：解析客户端发送的数据帧
 * @param {string} clientId - 客户端ID
 * @param {string} buffer - 数据缓冲区
 */
function parseDataFrame(clientId, buffer) {
  // 这里实现自定义数据帧格式解析
  // 假设数据帧格式为: [设备ID],[时间戳],[数据类型],[数据内容]\n
  const lines = buffer.split('\n');
  for (let i = 0; i < lines.length - 1; i++) {
    const line = lines[i].trim();
    if (line) {
      processDataLine(clientId, line);
    }
  }
  
  // 保留未处理的部分
  connections.get(clientId).buffer = lines[lines.length - 1];
}

/**
 * 处理数据行
 * 功能：处理解析后的数据行，包括设备认证和数据处理
 * @param {string} clientId - 客户端ID
 * @param {string} line - 数据行
 */
async function processDataLine(clientId, line) {
  try {
    const parts = line.split(',');
    if (parts.length < 4) {
      throw new Error('数据格式错误');
    }
    
    const [deviceId, timestamp, dataType, ...dataContent] = parts;
    const data = dataContent.join(',');
    
    const connection = connections.get(clientId);
    
    // 设备认证
    if (!connection.authenticated) {
      // 这里实现简单的设备认证逻辑
      // 实际项目中应该使用更安全的认证方式
      if (deviceId) {
        connection.authenticated = true;
        connection.deviceId = deviceId;
        devices.set(deviceId, {
          deviceId,
          clientId,
          connectedAt: connection.connectedAt,
          lastActivity: connection.lastActivity,
          dataType
        });
        console.log(`设备 ${deviceId} 认证成功`);
      } else {
        console.log(`设备认证失败: ${clientId}`);
        connections.get(clientId).socket.end();
        return;
      }
    }
    
    // 处理数据
    await processDeviceData(deviceId, timestamp, dataType, data);
    
  } catch (error) {
    console.error('处理数据错误:', error);
    logError(`处理数据错误: ${error.message}`);
  }
}

/**
 * 处理设备数据
 * 功能：处理设备发送的数据，包括格式转换和存储
 * @param {string} deviceId - 设备ID
 * @param {string} timestamp - 时间戳
 * @param {string} dataType - 数据类型
 * @param {string} data - 数据内容
 */
async function processDeviceData(deviceId, timestamp, dataType, data) {
  try {
    // 数据格式转换和预处理
    let parsedData;
    
    // 验证并解析JSON数据
    try {
      parsedData = JSON.parse(data);
    } catch (jsonError) {
      console.error(`设备 ${deviceId} 数据格式错误: ${data.substring(0, 50)}...`);
      logError(`设备 ${deviceId} 数据格式错误: ${data.substring(0, 100)}...`);
      return; // 跳过无效数据
    }
    
    const processedData = {
      deviceId,
      timestamp: new Date(timestamp),
      dataType,
      data: parsedData,
      receivedAt: new Date()
    };
    
    // 数据持久化存储
    await storeData(processedData);
    
    // 数据库存储
    await saveToDatabase(processedData);
    
  } catch (error) {
    console.error('处理设备数据错误:', error);
    logError(`处理设备数据错误: ${error.message}`);
  }
}

/**
 * 存储数据到文件
 * 功能：将数据存储到本地文件系统
 * @param {object} data - 要存储的数据
 * @returns {Promise} - 存储完成的Promise
 */
function storeData(data) {
  return new Promise((resolve, reject) => {
    const fileName = `${data.deviceId}_${new Date().toISOString().split('T')[0]}.json`;
    const filePath = path.join(SOCKET_CONFIG.storagePath, fileName);
    
    // 读取现有数据
    fs.readFile(filePath, 'utf8', (err, existingData) => {
      let dataArray = [];
      if (!err && existingData) {
        try {
          dataArray = JSON.parse(existingData);
        } catch (parseError) {
          console.error('解析现有数据错误:', parseError);
        }
      }
      
      // 添加新数据
      dataArray.push(data);
      
      // 写入文件
      fs.writeFile(filePath, JSON.stringify(dataArray, null, 2), (writeErr) => {
        if (writeErr) {
          console.error('写入数据文件错误:', writeErr);
          reject(writeErr);
        } else {
          resolve();
        }
      });
    });
  });
}

/**
 * 保存数据到数据库
 * 功能：将数据存储到数据库
 * @param {object} data - 要存储的数据
 */
async function saveToDatabase(data) {
  try {
    // 这里根据实际数据库结构实现
    // 假设我们有一个device_data表
    await pool.query(
      'INSERT INTO device_data (device_id, timestamp, data_type, data, received_at) VALUES (?, ?, ?, ?, ?)',
      [data.deviceId, data.timestamp, data.dataType, JSON.stringify(data.data), data.receivedAt]
    );
  } catch (error) {
    console.error('保存数据到数据库错误:', error);
    logError(`保存数据到数据库错误: ${error.message}`);
  }
}

/**
 * 处理断开连接
 * 功能：处理客户端断开连接的情况
 * @param {string} clientId - 客户端ID
 */
function handleDisconnect(clientId) {
  console.log(`客户端断开连接: ${clientId}`);
  
  const connection = connections.get(clientId);
  if (connection && connection.deviceId) {
    devices.delete(connection.deviceId);
  }
  
  connections.delete(clientId);
  connectionCount--;
}

/**
 * 处理错误
 * 功能：处理Socket连接错误
 * @param {string} clientId - 客户端ID
 * @param {Error} error - 错误对象
 */
function handleError(clientId, error) {
  console.error(`客户端错误 ${clientId}:`, error);
  logError(`客户端错误 ${clientId}: ${error.message}`);
  
  const connection = connections.get(clientId);
  if (connection) {
    connection.socket.end();
  }
}

/**
 * 日志记录
 * 功能：记录错误日志
 * @param {string} message - 错误消息
 */
function logError(message) {
  const logFileName = `error_${new Date().toISOString().split('T')[0]}.log`;
  const logFilePath = path.join(SOCKET_CONFIG.logPath, logFileName);
  
  const logMessage = `${new Date().toISOString()} - ${message}\n`;
  fs.appendFile(logFilePath, logMessage, (err) => {
    if (err) {
      console.error('写入错误日志失败:', err);
    }
  });
}

/**
 * 获取系统状态
 * 功能：获取当前系统状态
 * @returns {object} - 系统状态信息
 */
function getSystemStatus() {
  return {
    connectionCount,
    maxConnections: SOCKET_CONFIG.maxConnections,
    uptime: process.uptime(),
    memoryUsage: process.memoryUsage(),
    cpuUsage: process.cpuUsage(),
    timestamp: new Date()
  };
}

// 初始化Socket服务器
initSocketServer();

// Socket连接管理接口

/**
 * 获取连接状态
 * @route GET /socket/status
 * @description 获取Socket服务器状态和连接信息
 * @returns {object} 200 - 返回服务器状态和设备列表
 */
router.get('/status', function(req, res, next) {
  const deviceList = Array.from(devices.values());
  const status = {
    server: {
      port: SOCKET_CONFIG.port,
      maxConnections: SOCKET_CONFIG.maxConnections,
      connectionCount,
      uptime: process.uptime()
    },
    devices: deviceList,
    timestamp: new Date()
  };
  
  res.json({
    success: true,
    data: status
  });
});

/**
 * 获取设备列表
 * @route GET /socket/devices
 * @description 获取当前连接的设备列表
 * @returns {object} 200 - 返回设备列表
 */
router.get('/devices', function(req, res, next) {
  const deviceList = Array.from(devices.values());
  
  res.json({
    success: true,
    data: deviceList
  });
});

// 数据查询接口

/**
 * 查询历史数据
 * @route GET /socket/data
 * @description 查询设备历史数据
 * @param {string} deviceId - 设备ID（可选）
 * @param {string} startDate - 开始日期（可选）
 * @param {string} endDate - 结束日期（可选）
 * @param {number} limit - 限制返回数量（默认100）
 * @returns {object} 200 - 返回历史数据
 * @returns {object} 500 - 查询失败
 */
router.get('/data', async function(req, res, next) {
  try {
    const { deviceId, startDate, endDate, limit = 100 } = req.query;
    
    let query = 'SELECT * FROM device_data WHERE 1=1';
    const params = [];
    
    if (deviceId) {
      query += ' AND device_id = ?';
      params.push(deviceId);
    }
    
    if (startDate) {
      query += ' AND timestamp >= ?';
      params.push(startDate);
    }
    
    if (endDate) {
      query += ' AND timestamp <= ?';
      params.push(endDate);
    }
    
    query += ' ORDER BY timestamp DESC LIMIT ?';
    params.push(parseInt(limit));
    
    const [rows] = await pool.query(query, params);
    
    res.json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error('查询数据错误:', error);
    res.status(500).json({
      success: false,
      error: '查询数据失败'
    });
  }
});

// 系统监控接口

/**
 * 获取系统状态
 * @route GET /socket/system
 * @description 获取系统运行状态
 * @returns {object} 200 - 返回系统状态信息
 */
router.get('/system', function(req, res, next) {
  const status = getSystemStatus();
  
  res.json({
    success: true,
    data: status
  });
});

// 服务器管理接口

/**
 * 重启Socket服务器
 * @route POST /socket/restart
 * @description 重启Socket服务器
 * @returns {object} 200 - 重启成功
 * @returns {object} 500 - 重启失败
 */
router.post('/restart', function(req, res, next) {
  try {
    // 关闭现有服务器
    if (server) {
      server.close();
    }
    
    // 清理连接
    connections.forEach((connection) => {
      connection.socket.end();
    });
    connections.clear();
    devices.clear();
    connectionCount = 0;
    
    // 重新初始化
    initSocketServer();
    
    res.json({
      success: true,
      message: 'Socket服务器已重启'
    });
  } catch (error) {
    console.error('重启服务器错误:', error);
    res.status(500).json({
      success: false,
      error: '重启服务器失败'
    });
  }
});

// 导出路由模块
module.exports = router;