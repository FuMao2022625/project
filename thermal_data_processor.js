const fs = require('fs');
const path = require('path');
const mysql = require('mysql');

const LOG_DIR = path.join(__dirname, 'logs');
const DATA_DIR = path.join(__dirname, 'sensor_data');
const RAW_DATA_DIR = path.join(DATA_DIR, 'raw');
const PROCESSED_DATA_DIR = path.join(DATA_DIR, 'processed');

const VALID_FIRE_RISKS = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
const VALID_ENV_STATUSES = ['NORMAL', 'WARNING', 'ALERT', 'EMERGENCY'];

let dbConnection = null;

function initialize() {
  ensureDirectoryExists(LOG_DIR);
  ensureDirectoryExists(DATA_DIR);
  ensureDirectoryExists(RAW_DATA_DIR);
  ensureDirectoryExists(PROCESSED_DATA_DIR);
  
  initializeDatabase();
  
  log('INFO', '数据处理器初始化完成');
}

function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    log('INFO', `创建目录: ${dirPath}`);
  }
}

function initializeDatabase() {
  dbConnection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '12305',
    database: 'thermal_sensor_data',
    charset: 'utf8mb4'
  });
  
  dbConnection.connect(function(err) {
    if (err) {
      log('ERROR', `数据库连接失败: ${err.message}`);
      dbConnection = null;
    } else {
      log('INFO', `数据库连接成功，连接ID: ${dbConnection.threadId}`);
    }
  });
  
  dbConnection.on('error', function(err) {
    log('ERROR', `数据库连接错误: ${err.message}`);
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
      log('INFO', '尝试重新连接数据库...');
      initializeDatabase();
    }
  });
}

function log(level, message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level}] ${message}\n`;
  
  console.log(logMessage.trim());
  
  const logFile = path.join(LOG_DIR, `processor_${getDateString()}.log`);
  fs.appendFileSync(logFile, logMessage, 'utf8');
}

function getDateString() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function getTimestampString() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

async function processRawData(rawData, clientInfo) {
  const processingId = getTimestampString();
  log('INFO', `开始处理数据 [ID: ${processingId}] 来自客户端: ${clientInfo}`);
  
  try {
    await saveRawData(rawData, processingId, clientInfo);
    
    const parsedData = parseAndValidateData(rawData, processingId);
    
    await saveToDatabase(parsedData, processingId);
    
    await saveProcessedData(parsedData, processingId);
    
    log('INFO', `数据处理完成 [ID: ${processingId}]`);
    return { success: true, processingId, data: parsedData };
    
  } catch (error) {
    log('ERROR', `数据处理失败 [ID: ${processingId}]: ${error.message}`);
    return { success: false, processingId, error: error.message };
  }
}

async function saveRawData(rawData, processingId, clientInfo) {
  const filename = `raw_${processingId}.txt`;
  const filepath = path.join(RAW_DATA_DIR, filename);
  
  const content = `处理ID: ${processingId}
客户端: ${clientInfo}
时间: ${new Date().toISOString()}
原始数据:
${rawData}
`;
  
  fs.writeFileSync(filepath, content, 'utf8');
  log('INFO', `原始数据已保存: ${filename}`);
}

function parseAndValidateData(rawData, processingId) {
  let parsedData;
  
  try {
    parsedData = JSON.parse(rawData);
  } catch (error) {
    throw new Error(`JSON解析失败: ${error.message}`);
  }
  
  const validatedData = {
    sensor_type: validateString(parsedData.type, 'sensor_type', 50),
    temperature: validateNumber(parsedData.temperature, 'temperature', -50, 150),
    humidity: validateNumber(parsedData.humidity, 'humidity', 0, 100),
    smoke_level: validateNumber(parsedData.smoke_level, 'smoke_level', 0, 1),
    max_temp: validateTemperatureMatrix(parsedData.max_temp),
    human_detected: validateBoolean(parsedData.human_detected, 'human_detected'),
    fire_risk: validateEnum(parsedData.fire_risk, 'fire_risk', VALID_FIRE_RISKS),
    env_status: validateEnum(parsedData.env_status, 'env_status', VALID_ENV_STATUSES),
    battery: validateNumber(parsedData.battery, 'battery', 0, 100),
    recorded_at: new Date()
  };
  
  log('INFO', `数据验证通过 [ID: ${processingId}]`);
  return validatedData;
}

function validateString(value, fieldName, maxLength) {
  if (value === undefined || value === null) {
    throw new Error(`字段 ${fieldName} 不能为空`);
  }
  
  const strValue = String(value);
  if (strValue.length > maxLength) {
    throw new Error(`字段 ${fieldName} 长度超过限制 (${maxLength})`);
  }
  
  return strValue;
}

function validateNumber(value, fieldName, min, max) {
  if (value === undefined || value === null) {
    throw new Error(`字段 ${fieldName} 不能为空`);
  }
  
  const numValue = Number(value);
  
  if (isNaN(numValue)) {
    throw new Error(`字段 ${fieldName} 不是有效的数字: ${value}`);
  }
  
  if (numValue < min || numValue > max) {
    throw new Error(`字段 ${fieldName} 超出范围 [${min}, ${max}]: ${numValue}`);
  }
  
  return numValue;
}

function validateBoolean(value, fieldName) {
  if (value === undefined || value === null) {
    throw new Error(`字段 ${fieldName} 不能为空`);
  }
  
  if (typeof value === 'boolean') {
    return value;
  }
  
  if (value === 'true' || value === 1 || value === '1') {
    return true;
  }
  
  if (value === 'false' || value === 0 || value === '0') {
    return false;
  }
  
  throw new Error(`字段 ${fieldName} 不是有效的布尔值: ${value}`);
}

function validateEnum(value, fieldName, validValues) {
  if (value === undefined || value === null) {
    throw new Error(`字段 ${fieldName} 不能为空`);
  }
  
  const upperValue = String(value).toUpperCase();
  
  if (!validValues.includes(upperValue)) {
    throw new Error(`字段 ${fieldName} 值无效: ${value}, 有效值: ${validValues.join(', ')}`);
  }
  
  return upperValue;
}

function validateTemperatureMatrix(matrix) {
  if (!Array.isArray(matrix)) {
    throw new Error('max_temp 必须是数组');
  }
  
  if (matrix.length !== 8) {
    throw new Error(`max_temp 必须是8x8矩阵，当前行数: ${matrix.length}`);
  }
  
  for (let i = 0; i < matrix.length; i++) {
    if (!Array.isArray(matrix[i])) {
      throw new Error(`max_temp 第${i}行不是数组`);
    }
    
    if (matrix[i].length !== 8) {
      throw new Error(`max_temp 第${i}行必须有8个元素，当前: ${matrix[i].length}`);
    }
    
    for (let j = 0; j < matrix[i].length; j++) {
      const temp = Number(matrix[i][j]);
      if (isNaN(temp)) {
        throw new Error(`max_temp [${i}][${j}] 不是有效数字: ${matrix[i][j]}`);
      }
      if (temp < -50 || temp > 150) {
        throw new Error(`max_temp [${i}][${j}] 温度超出范围: ${temp}`);
      }
    }
  }
  
  return JSON.stringify(matrix);
}

async function saveToDatabase(data, processingId) {
  if (!dbConnection) {
    log('WARN', `数据库未连接，跳过数据库存储 [ID: ${processingId}]`);
    return;
  }
  
  return new Promise((resolve, reject) => {
    const sql = `INSERT INTO thermal_sensor_data 
      (sensor_type, temperature, humidity, smoke_level, max_temp, human_detected, fire_risk, env_status, battery, recorded_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    
    const values = [
      data.sensor_type,
      data.temperature,
      data.humidity,
      data.smoke_level,
      data.max_temp,
      data.human_detected,
      data.fire_risk,
      data.env_status,
      data.battery,
      data.recorded_at
    ];
    
    dbConnection.query(sql, values, function(error, results) {
      if (error) {
        log('ERROR', `数据库插入失败 [ID: ${processingId}]: ${error.message}`);
        reject(error);
      } else {
        log('INFO', `数据已存入数据库 [ID: ${processingId}], 记录ID: ${results.insertId}`);
        resolve(results);
      }
    });
  });
}

async function saveProcessedData(data, processingId) {
  const filename = `processed_${processingId}.json`;
  const filepath = path.join(PROCESSED_DATA_DIR, filename);
  
  const content = JSON.stringify(data, null, 2);
  fs.writeFileSync(filepath, content, 'utf8');
  log('INFO', `处理后数据已保存: ${filename}`);
}

function closeDatabase() {
  if (dbConnection) {
    dbConnection.end(function(err) {
      if (err) {
        log('ERROR', `关闭数据库连接失败: ${err.message}`);
      } else {
        log('INFO', '数据库连接已关闭');
      }
    });
  }
}

module.exports = {
  initialize,
  processRawData,
  closeDatabase,
  log
};
