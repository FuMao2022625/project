const fs = require('fs');
const path = require('path');
const mysql = require('mysql');

const LOG_DIR = path.join(__dirname, 'logs');
const DATA_DIR = path.join(__dirname, 'data');
const RAW_DATA_DIR = path.join(DATA_DIR, 'raw');
const PROCESSED_DATA_DIR = path.join(DATA_DIR, 'processed');

const VALID_FIRE_RISKS = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
const VALID_ENV_STATUSES = ['NORMAL', 'WARNING', 'ALERT', 'EMERGENCY'];

let dbConnection = null;

function initialize() {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(RAW_DATA_DIR)) {
    fs.mkdirSync(RAW_DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(PROCESSED_DATA_DIR)) {
    fs.mkdirSync(PROCESSED_DATA_DIR, { recursive: true });
  }
  
  initializeDatabase();
  
  log('INFO', '数据处理器初始化完成');
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

function getDbConnection() {
  return dbConnection;
}

async function processRawData(rawData, clientInfo) {
  const processingId = getTimestampString();
  log('INFO', `开始处理数据 [ID: ${processingId}] 来自客户端: ${clientInfo}`);
  
  try {
    const dataStorage = require('./data-storage');
    const dataValidator = require('./data-validator');
    
    dataStorage.saveRawData(rawData, processingId, clientInfo);
    
    const parsedData = dataValidator.parseAndValidateData(rawData, processingId);
    
    await dataStorage.saveToDatabase(parsedData, processingId);
    
    dataStorage.saveProcessedData(parsedData, processingId);
    
    log('INFO', `数据处理完成 [ID: ${processingId}]`);
    return { success: true, processingId, data: parsedData };
    
  } catch (error) {
    log('ERROR', `数据处理失败 [ID: ${processingId}]: ${error.message}`);
    return { success: false, processingId, error: error.message };
  }
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
  log,
  getDateString,
  getTimestampString,
  getDbConnection,
  processRawData,
  closeDatabase,
  LOG_DIR,
  DATA_DIR,
  RAW_DATA_DIR,
  PROCESSED_DATA_DIR,
  VALID_FIRE_RISKS,
  VALID_ENV_STATUSES
};
