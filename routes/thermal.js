var express = require('express');
var router = express.Router();
var connection = require('../db');

// 热成像数据验证配置
const VALIDATION_CONFIG = {
  ROWS: 8,
  COLS: 8,
  MIN_TEMP: -40,
  MAX_TEMP: 150,
  DEVICE_ID_PATTERN: /^THERMAL-[A-Z0-9]{3,10}$/
};

/**
 * 验证热成像数据格式
 * @param {Object} data - 热成像数据对象
 * @returns {Object} - 验证结果 {valid: boolean, errors: string[]}
 */
function validateThermalData(data) {
  const errors = [];

  // 验证数据对象是否存在
  if (!data || typeof data !== 'object') {
    errors.push('数据对象不能为空');
    return { valid: false, errors };
  }

  // 验证设备ID
  if (!data.deviceId) {
    errors.push('设备ID不能为空');
  } else if (!VALIDATION_CONFIG.DEVICE_ID_PATTERN.test(data.deviceId)) {
    errors.push('设备ID格式不正确，应为 THERMAL-XXX 格式');
  }

  // 验证温度矩阵
  if (!data.matrix || !Array.isArray(data.matrix)) {
    errors.push('温度矩阵不能为空');
  } else {
    // 验证矩阵行数
    if (data.matrix.length !== VALIDATION_CONFIG.ROWS) {
      errors.push(`矩阵行数不正确，应为 ${VALIDATION_CONFIG.ROWS} 行，实际为 ${data.matrix.length} 行`);
    }

    // 验证每行的列数和温度值
    data.matrix.forEach((row, rowIndex) => {
      if (!Array.isArray(row)) {
        errors.push(`第 ${rowIndex + 1} 行不是数组`);
        return;
      }

      if (row.length !== VALIDATION_CONFIG.COLS) {
        errors.push(`第 ${rowIndex + 1} 行列数不正确，应为 ${VALIDATION_CONFIG.COLS} 列，实际为 ${row.length} 列`);
      }

      row.forEach((temp, colIndex) => {
        const tempValue = parseFloat(temp);
        if (isNaN(tempValue)) {
          errors.push(`第 ${rowIndex + 1} 行第 ${colIndex + 1} 列的温度值不是有效数字: ${temp}`);
        } else if (tempValue < VALIDATION_CONFIG.MIN_TEMP || tempValue > VALIDATION_CONFIG.MAX_TEMP) {
          errors.push(`第 ${rowIndex + 1} 行第 ${colIndex + 1} 列的温度值超出范围: ${tempValue}°C (允许范围: ${VALIDATION_CONFIG.MIN_TEMP}°C ~ ${VALIDATION_CONFIG.MAX_TEMP}°C)`);
        }
      });
    });
  }

  // 验证统计温度值
  if (data.maxTemp !== undefined) {
    const maxTemp = parseFloat(data.maxTemp);
    if (isNaN(maxTemp)) {
      errors.push('最高温度值不是有效数字');
    } else if (maxTemp < VALIDATION_CONFIG.MIN_TEMP || maxTemp > VALIDATION_CONFIG.MAX_TEMP) {
      errors.push(`最高温度值超出范围: ${maxTemp}°C`);
    }
  }

  if (data.minTemp !== undefined) {
    const minTemp = parseFloat(data.minTemp);
    if (isNaN(minTemp)) {
      errors.push('最低温度值不是有效数字');
    } else if (minTemp < VALIDATION_CONFIG.MIN_TEMP || minTemp > VALIDATION_CONFIG.MAX_TEMP) {
      errors.push(`最低温度值超出范围: ${minTemp}°C`);
    }
  }

  if (data.avgTemp !== undefined) {
    const avgTemp = parseFloat(data.avgTemp);
    if (isNaN(avgTemp)) {
      errors.push('平均温度值不是有效数字');
    } else if (avgTemp < VALIDATION_CONFIG.MIN_TEMP || avgTemp > VALIDATION_CONFIG.MAX_TEMP) {
      errors.push(`平均温度值超出范围: ${avgTemp}°C`);
    }
  }

  return {
    valid: errors.length === 0,
    errors: errors
  };
}

/**
 * 计算温度矩阵的统计值
 * @param {Array} matrix - 温度矩阵
 * @returns {Object} - {max, min, avg}
 */
function calculateStats(matrix) {
  let max = -Infinity;
  let min = Infinity;
  let sum = 0;
  let count = 0;

  matrix.forEach(row => {
    row.forEach(temp => {
      const tempValue = parseFloat(temp);
      max = Math.max(max, tempValue);
      min = Math.min(min, tempValue);
      sum += tempValue;
      count++;
    });
  });

  return {
    max: max.toFixed(2),
    min: min.toFixed(2),
    avg: (sum / count).toFixed(2)
  };
}

/**
 * 生成8x8模拟热成像数据
 * @returns {Object} - 热成像数据对象
 */
function generateThermalData() {
  const matrix = [];
  
  // 生成8x8的温度矩阵
  for (let i = 0; i < VALIDATION_CONFIG.ROWS; i++) {
    const row = [];
    for (let j = 0; j < VALIDATION_CONFIG.COLS; j++) {
      // 基础温度20-30度，加上一些随机波动
      const baseTemp = 20 + Math.random() * 10;
      // 模拟热点区域（中心区域温度较高）
      if (i >= 2 && i <= 5 && j >= 2 && j <= 5) {
        row.push((baseTemp + 10 + Math.random() * 5).toFixed(2));
      } else {
        row.push(baseTemp.toFixed(2));
      }
    }
    matrix.push(row);
  }

  const stats = calculateStats(matrix);

  return {
    dataId: 'THERMAL-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
    deviceId: 'THERMAL-001',
    timestamp: new Date().toISOString(),
    matrix: matrix,
    maxTemp: stats.max,
    minTemp: stats.min,
    avgTemp: stats.avg,
    rowCount: VALIDATION_CONFIG.ROWS,
    colCount: VALIDATION_CONFIG.COLS
  };
}

/**
 * 将热成像数据保存到数据库
 * @param {Object} data - 热成像数据
 * @returns {Promise} - 保存结果
 */
function saveThermalData(data) {
  return new Promise((resolve, reject) => {
    const sql = `
      INSERT INTO thermal_data 
      (data_id, device_id, matrix_data, max_temp, min_temp, avg_temp, row_count, col_count, recorded_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      data.dataId,
      data.deviceId,
      JSON.stringify(data.matrix),
      data.maxTemp,
      data.minTemp,
      data.avgTemp,
      data.rowCount,
      data.colCount,
      new Date(data.timestamp)
    ];

    connection.query(sql, values, (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
}

/**
 * 获取最新的热成像数据
 * @param {number} limit - 获取记录数量
 * @returns {Promise} - 查询结果
 */
function getLatestThermalData(limit = 1) {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT 
        id,
        data_id as dataId,
        device_id as deviceId,
        matrix_data as matrix,
        max_temp as maxTemp,
        min_temp as minTemp,
        avg_temp as avgTemp,
        row_count as rowCount,
        col_count as colCount,
        recorded_at as timestamp,
        created_at as createdAt
      FROM thermal_data
      ORDER BY recorded_at DESC
      LIMIT ?
    `;

    connection.query(sql, [limit], (err, results) => {
      if (err) {
        reject(err);
      } else {
        // 解析JSON矩阵数据
        results.forEach(row => {
          if (typeof row.matrix === 'string') {
            row.matrix = JSON.parse(row.matrix);
          }
          row.timestamp = new Date(row.timestamp).toISOString();
        });
        resolve(results);
      }
    });
  });
}

// SSE端点 - 实时推送热成像数据
router.get('/thermal-stream', async function(req, res, next) {
  console.log('SSE连接请求到达');
  
  // 设置SSE响应头
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('X-Accel-Buffering', 'no'); // 禁用Nginx缓冲
  
  // 禁用压缩
  res.setHeader('Content-Encoding', 'identity');

  let isConnectionActive = true;
  let consecutiveErrors = 0;
  const MAX_CONSECUTIVE_ERRORS = 5;
  const HEARTBEAT_INTERVAL = 30000; // 30秒心跳
  const DATA_INTERVAL = 1000; // 1秒发送一次数据

  // 发送消息的函数
  const sendMessage = (message) => {
    if (!isConnectionActive) return;
    try {
      const messageStr = JSON.stringify(message);
      const sseMessage = `data: ${messageStr}\n\n`;
      console.log('发送SSE消息:', message.type || 'data');
      res.write(sseMessage);
      // 确保消息立即发送
      if (res.flush) {
        res.flush();
      }
    } catch (error) {
      console.warn('发送消息失败:', error.message);
    }
  };

  // 发送心跳的函数
  const sendHeartbeat = () => {
    const heartbeatData = {
      type: 'heartbeat',
      timestamp: new Date().toISOString()
    };
    sendMessage(heartbeatData);
  };

  // 发送数据的函数
  const sendData = async () => {
    if (!isConnectionActive) return;

    try {
      // 生成模拟数据
      const data = generateThermalData();

      // 验证数据
      const validation = validateThermalData(data);
      if (!validation.valid) {
        console.error('数据验证失败:', validation.errors);
        consecutiveErrors++;
        if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
          throw new Error('连续数据验证失败次数过多');
        }
        return;
      }

      // 重置错误计数
      consecutiveErrors = 0;

      // 保存到数据库
      await saveThermalData(data);

      // 发送给客户端
      sendMessage(data);

    } catch (error) {
      // 忽略连接中断错误
      if (error.code === 'ECONNRESET' || error.message.includes('aborted')) {
        console.log('SSE客户端连接中断:', error.message);
        isConnectionActive = false;
        res.end();
        return;
      }

      console.error('SSE数据处理错误:', error);
      consecutiveErrors++;

      // 发送错误信息给客户端
      const errorData = {
        type: 'error',
        message: '数据处理错误',
        timestamp: new Date().toISOString()
      };
      
      sendMessage(errorData);

      // 如果错误过多，关闭连接
      if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
        console.error('SSE连接错误次数过多，关闭连接');
        isConnectionActive = false;
        res.end();
      }
    }
  };

  // 发送初始数据
  try {
    console.log('发送初始热成像数据');
    await sendData();
  } catch (error) {
    console.error('发送初始数据失败:', error);
  }

  // 定期发送数据（1秒一次）
  console.log('开始定期发送数据，间隔:', DATA_INTERVAL, 'ms');
  const dataInterval = setInterval(sendData, DATA_INTERVAL);
  
  // 定期发送心跳（30秒一次）
  console.log('开始定期发送心跳，间隔:', HEARTBEAT_INTERVAL, 'ms');
  const heartbeatInterval = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL);

  // 处理连接关闭
  req.on('close', () => {
    console.log('SSE连接已关闭（客户端主动断开）');
    isConnectionActive = false;
    clearInterval(dataInterval);
    clearInterval(heartbeatInterval);
  });

  // 处理连接错误
  req.on('error', (error) => {
    // 忽略正常的连接中断
    if (error.code === 'ECONNRESET' || error.message.includes('aborted')) {
      console.log('SSE连接错误（客户端断开）:', error.message);
    } else {
      console.error('SSE连接错误:', error);
    }
    isConnectionActive = false;
    clearInterval(dataInterval);
    clearInterval(heartbeatInterval);
    try {
      res.end();
    } catch (endError) {
      // 忽略结束连接时的错误
    }
  });

  // 处理响应错误
  res.on('error', (error) => {
    console.error('SSE响应错误:', error);
    isConnectionActive = false;
    clearInterval(dataInterval);
    clearInterval(heartbeatInterval);
  });
  
  console.log('SSE连接已建立，等待客户端连接');
});

// 获取最新热成像数据（REST API）
router.get('/latest-thermal', async function(req, res, next) {
  try {
    const data = await getLatestThermalData(1);
    if (data.length === 0) {
      return res.status(404).json({
        success: false,
        message: '暂无热成像数据'
      });
    }
    res.json({
      success: true,
      data: data[0]
    });
  } catch (error) {
    console.error('获取最新热成像数据失败:', error);
    res.status(500).json({
      success: false,
      message: '获取数据失败',
      error: error.message
    });
  }
});

// 获取历史热成像数据
router.get('/thermal-history', async function(req, res, next) {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const offset = parseInt(req.query.offset) || 0;

    // 限制最大返回数量
    const safeLimit = Math.min(limit, 100);

    const sql = `
      SELECT 
        id,
        data_id as dataId,
        device_id as deviceId,
        matrix_data as matrix,
        max_temp as maxTemp,
        min_temp as minTemp,
        avg_temp as avgTemp,
        row_count as rowCount,
        col_count as colCount,
        recorded_at as timestamp,
        created_at as createdAt
      FROM thermal_data
      ORDER BY recorded_at DESC
      LIMIT ? OFFSET ?
    `;

    connection.query(sql, [safeLimit, offset], (err, results) => {
      if (err) {
        throw err;
      }

      // 解析JSON矩阵数据
      results.forEach(row => {
        if (typeof row.matrix === 'string') {
          row.matrix = JSON.parse(row.matrix);
        }
        row.timestamp = new Date(row.timestamp).toISOString();
      });

      res.json({
        success: true,
        data: results,
        pagination: {
          limit: safeLimit,
          offset: offset,
          count: results.length
        }
      });
    });
  } catch (error) {
    console.error('获取历史热成像数据失败:', error);
    res.status(500).json({
      success: false,
      message: '获取历史数据失败',
      error: error.message
    });
  }
});

// 手动提交热成像数据（用于外部设备上传）
router.post('/thermal-data', async function(req, res, next) {
  try {
    const data = req.body;

    // 验证数据
    const validation = validateThermalData(data);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: '数据验证失败',
        errors: validation.errors
      });
    }

    // 计算统计数据（如果没有提供）
    if (!data.maxTemp || !data.minTemp || !data.avgTemp) {
      const stats = calculateStats(data.matrix);
      data.maxTemp = stats.max;
      data.minTemp = stats.min;
      data.avgTemp = stats.avg;
    }

    // 添加元数据
    data.dataId = data.dataId || 'THERMAL-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    data.timestamp = data.timestamp || new Date().toISOString();
    data.rowCount = VALIDATION_CONFIG.ROWS;
    data.colCount = VALIDATION_CONFIG.COLS;

    // 保存到数据库
    await saveThermalData(data);

    res.json({
      success: true,
      message: '数据保存成功',
      data: {
        dataId: data.dataId,
        timestamp: data.timestamp
      }
    });
  } catch (error) {
    console.error('保存热成像数据失败:', error);
    res.status(500).json({
      success: false,
      message: '保存数据失败',
      error: error.message
    });
  }
});

module.exports = router;
module.exports.validateThermalData = validateThermalData;
module.exports.calculateStats = calculateStats;
