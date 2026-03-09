/**
 * 数据库连接与初始化模块
 * 功能：创建数据库连接池，初始化数据库结构，处理数据库错误
 * 作者：系统生成
 * 创建日期：2024-01-01
 * 主要修改记录：
 * 2024-01-01 - 初始化文件
 * 2026-03-07 - 添加设备表和设备数据表支持
 * 2026-03-09 - 代码重构和优化
 */

// 导入mysql2模块
const mysql = require('mysql2/promise');

// 数据库配置
const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '12305',
  database: process.env.DB_NAME || 'express_pro',
  charset: 'utf8mb4'
};

/**
 * MySQL连接池配置
 * 用于管理数据库连接，提高性能和可靠性
 */
const pool = mysql.createPool({
  ...DB_CONFIG,
  waitForConnections: true,
  connectionLimit: 15, // 优化连接池大小
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 30000,
  connectTimeout: 10000
});

/**
 * 检查数据库是否存在，不存在则创建
 * @returns {Promise<void>}
 */
async function ensureDatabaseExists() {
  const tempPool = mysql.createPool({
    ...DB_CONFIG,
    database: undefined, // 不指定数据库
    connectionLimit: 10,
    queueLimit: 0
  });
  
  let connection;
  try {
    connection = await tempPool.getConnection();
    
    const [databases] = await connection.query(
      `SHOW DATABASES LIKE '${DB_CONFIG.database}'`
    );
    
    if (databases.length === 0) {
      await connection.query(
        `CREATE DATABASE ${DB_CONFIG.database} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
      );
      console.log('数据库创建成功');
    }
  } finally {
    if (connection) {
      connection.release();
    }
    tempPool.end();
  }
}

/**
 * 初始化用户表
 * @param {mysql.PoolConnection} connection - 数据库连接
 */
async function initializeUsersTable(connection) {
  const [tables] = await connection.query(
    "SHOW TABLES LIKE 'users'"
  );
  
  if (tables.length > 0) {
    // 表存在，检查是否需要添加新字段
    const [columns] = await connection.query(
      "SHOW COLUMNS FROM users"
    );
    
    const columnNames = columns.map(col => col.Field);
    
    // 如果status字段不存在，添加它
    if (!columnNames.includes('status')) {
      await connection.query(
        "ALTER TABLE users ADD COLUMN status ENUM('active', 'pending_deletion', 'deleted') DEFAULT 'active'"
      );
    }
    
    // 如果deactivated_at字段不存在，添加它
    if (!columnNames.includes('deactivated_at')) {
      await connection.query(
        "ALTER TABLE users ADD COLUMN deactivated_at TIMESTAMP NULL"
      );
    }
    
    // 如果deactivation_reason字段不存在，添加它
    if (!columnNames.includes('deactivation_reason')) {
      await connection.query(
        "ALTER TABLE users ADD COLUMN deactivation_reason VARCHAR(255) NULL"
      );
    }
  } else {
    // 表不存在，创建新表
    await connection.query(`
      CREATE TABLE users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        status ENUM('active', 'pending_deletion', 'deleted') DEFAULT 'active',
        deactivated_at TIMESTAMP NULL,
        deactivation_reason VARCHAR(255) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  }
  console.log('用户表已创建或已存在');
}

/**
 * 初始化设备表
 * @param {mysql.PoolConnection} connection - 数据库连接
 */
async function initializeDevicesTable(connection) {
  await connection.query(`
    CREATE TABLE IF NOT EXISTS devices (
      id INT AUTO_INCREMENT PRIMARY KEY,
      device_id VARCHAR(50) UNIQUE NOT NULL COMMENT '设备唯一标识',
      name VARCHAR(100) NOT NULL COMMENT '设备名称',
      type VARCHAR(50) NOT NULL COMMENT '设备类型',
      status ENUM('online', 'offline', 'error') DEFAULT 'offline' COMMENT '设备状态',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
      INDEX idx_device_id (device_id),
      INDEX idx_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('设备表创建成功');
}

/**
 * 初始化机器人表
 * @param {mysql.PoolConnection} connection - 数据库连接
 */
async function initializeRobotsTable(connection) {
  await connection.query(`
    CREATE TABLE IF NOT EXISTS robots (
      id INT AUTO_INCREMENT PRIMARY KEY,
      robot_id VARCHAR(50) UNIQUE NOT NULL COMMENT '机器人唯一标识',
      model VARCHAR(100) NOT NULL COMMENT '机器人型号',
      status ENUM('online', 'offline', 'maintenance') DEFAULT 'offline' COMMENT '机器人状态',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
      INDEX idx_robot_id (robot_id),
      INDEX idx_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('机器人表创建成功');
}

/**
 * 初始化环境表
 * @param {mysql.PoolConnection} connection - 数据库连接
 */
async function initializeEnvironmentsTable(connection) {
  await connection.query(`
    CREATE TABLE IF NOT EXISTS environments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      env_id VARCHAR(50) UNIQUE NOT NULL COMMENT '环境编号',
      location VARCHAR(255) NOT NULL COMMENT '位置信息',
      temperature DECIMAL(5,2) COMMENT '温度参数',
      humidity DECIMAL(5,2) COMMENT '湿度参数',
      pressure DECIMAL(6,2) COMMENT '压力参数',
      monitored_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '监测时间',
      INDEX idx_env_id (env_id),
      INDEX idx_location (location),
      INDEX idx_monitored_at (monitored_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('环境表创建成功');
}

/**
 * 初始化热成像表
 * @param {mysql.PoolConnection} connection - 数据库连接
 */
async function initializeThermalImagesTable(connection) {
  await connection.query(`
    CREATE TABLE IF NOT EXISTS thermal_images (
      id INT AUTO_INCREMENT PRIMARY KEY,
      image_id VARCHAR(50) UNIQUE NOT NULL COMMENT '热成像数据ID',
      robot_id VARCHAR(50) NOT NULL COMMENT '关联机器人ID',
      captured_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '成像时间',
      temperature_data JSON COMMENT '温度数据',
      image_path VARCHAR(255) NOT NULL COMMENT '图像存储路径',
      INDEX idx_image_id (image_id),
      INDEX idx_robot_id (robot_id),
      INDEX idx_captured_at (captured_at),
      FOREIGN KEY (robot_id) REFERENCES robots(robot_id) ON DELETE CASCADE ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('热成像表创建成功');
}

/**
 * 初始化设备数据表
 * @param {mysql.PoolConnection} connection - 数据库连接
 */
async function initializeDeviceDataTable(connection) {
  // 检查表是否存在
  const [tables] = await connection.query("SHOW TABLES LIKE 'device_data'");
  
  if (tables.length > 0) {
    // 表存在，检查索引
    const [indexes] = await connection.query("SHOW INDEX FROM device_data");
    const indexNames = indexes.map(idx => idx.Key_name);
    
    // 添加复合索引
    if (!indexNames.includes('idx_device_type_timestamp')) {
      await connection.query("CREATE INDEX idx_device_type_timestamp ON device_data(device_id, data_type, timestamp)");
      console.log('设备数据表添加复合索引成功');
    }
  } else {
    // 表不存在，创建新表
    await connection.query(`
      CREATE TABLE IF NOT EXISTS device_data (
        id INT AUTO_INCREMENT PRIMARY KEY,
        device_id VARCHAR(50) NOT NULL COMMENT '设备唯一标识',
        timestamp TIMESTAMP NOT NULL COMMENT '数据时间戳',
        data_type VARCHAR(50) NOT NULL COMMENT '数据类型',
        data JSON COMMENT '数据内容',
        received_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '接收时间',
        INDEX idx_device_id (device_id),
        INDEX idx_timestamp (timestamp),
        INDEX idx_data_type (data_type),
        INDEX idx_device_type_timestamp (device_id, data_type, timestamp),
        FOREIGN KEY (device_id) REFERENCES devices(device_id) ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('设备数据表创建成功');
  }
}

/**
 * 初始化传感器数据表
 * @param {mysql.PoolConnection} connection - 数据库连接
 */
async function initializeSensorDataTable(connection) {
  // 检查表是否存在
  const [tables] = await connection.query("SHOW TABLES LIKE 'sensor_data'");
  
  if (tables.length > 0) {
    // 表存在，检查是否需要修改字段类型
    const [columns] = await connection.query("SHOW COLUMNS FROM sensor_data");
    const columnNames = columns.map(col => col.Field);
    
    // 检查battery字段类型
    const batteryColumn = columns.find(col => col.Field === 'battery');
    if (batteryColumn && batteryColumn.Type === 'int(11)') {
      await connection.query("ALTER TABLE sensor_data MODIFY COLUMN battery TINYINT UNSIGNED NOT NULL COMMENT '电池电量'");
      console.log('传感器数据表battery字段类型优化成功');
    }
    
    // 检查索引
    const [indexes] = await connection.query("SHOW INDEX FROM sensor_data");
    const indexNames = indexes.map(idx => idx.Key_name);
    
    // 添加复合索引
    if (!indexNames.includes('idx_device_timestamp')) {
      await connection.query("CREATE INDEX idx_device_timestamp ON sensor_data(device_id, timestamp)");
      console.log('传感器数据表添加复合索引成功');
    }
    
    // 移除不必要的索引
    const indexesToRemove = ['idx_temperature', 'idx_humidity', 'idx_smoke_level', 'idx_human_detected'];
    for (const index of indexesToRemove) {
      if (indexNames.includes(index)) {
        await connection.query(`DROP INDEX ${index} ON sensor_data`);
        console.log(`传感器数据表移除索引 ${index} 成功`);
      }
    }
  } else {
    // 表不存在，创建新表
    await connection.query(`
      CREATE TABLE IF NOT EXISTS sensor_data (
        id INT AUTO_INCREMENT PRIMARY KEY,
        device_id VARCHAR(50) NOT NULL COMMENT '设备唯一标识',
        type VARCHAR(50) NOT NULL COMMENT '数据类型',
        temperature DECIMAL(5,2) NOT NULL COMMENT '温度值',
        humidity DECIMAL(5,2) NOT NULL COMMENT '湿度值',
        smoke_level DECIMAL(4,2) NOT NULL COMMENT '烟雾水平',
        max_temp DECIMAL(5,2) NOT NULL COMMENT '最高温度',
        human_detected TINYINT(1) NOT NULL COMMENT '是否检测到人',
        fire_risk TINYINT(1) NOT NULL COMMENT '火灾风险',
        env_status TINYINT(1) NOT NULL COMMENT '环境状态',
        battery TINYINT UNSIGNED NOT NULL COMMENT '电池电量',
        timestamp TIMESTAMP NOT NULL COMMENT '数据时间戳',
        received_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '接收时间',
        INDEX idx_device_id (device_id),
        INDEX idx_timestamp (timestamp),
        INDEX idx_fire_risk (fire_risk),
        INDEX idx_device_timestamp (device_id, timestamp),
        FOREIGN KEY (device_id) REFERENCES devices(device_id) ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('传感器数据表创建成功');
  }
}

/**
 * 初始化数据库
 * 功能：检查数据库是否存在，创建数据库，创建表结构
 * @returns {Promise<void>} - 初始化完成的Promise
 * @throws {Error} - 数据库初始化失败时抛出错误
 */
async function initializeDatabase() {
  try {
    // 确保数据库存在
    await ensureDatabaseExists();
    
    // 测试与实际数据库的连接
    const connection = await pool.getConnection();
    
    try {
      // 初始化用户表
      await initializeUsersTable(connection);
      
      // 初始化其他表
      await initializeDevicesTable(connection);
      await initializeRobotsTable(connection);
      await initializeEnvironmentsTable(connection);
      await initializeThermalImagesTable(connection);
      await initializeDeviceDataTable(connection);
      await initializeSensorDataTable(connection);
      
      console.log('数据库连接成功');
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('数据库初始化错误:', error);
    throw error;
  }
}

/**
 * 连接池错误处理
 * 功能：捕获并处理MySQL连接池错误
 * @param {Error} err - 错误对象
 */
pool.on('error', (err) => {
  console.error('MySQL连接池错误:', err);
});

/**
 * 数据库性能监控
 * 功能：监控数据库查询执行时间和连接池状态
 */
class DatabaseMonitor {
  constructor() {
    this.queryCount = 0;
    this.totalQueryTime = 0;
    this.startTime = Date.now();
  }

  /**
   * 记录查询执行时间
   * @param {string} query - 查询语句
   * @param {number} duration - 执行时间（毫秒）
   */
  recordQuery(query, duration) {
    this.queryCount++;
    this.totalQueryTime += duration;
    
    // 每100次查询输出一次统计信息
    if (this.queryCount % 100 === 0) {
      const avgQueryTime = this.totalQueryTime / this.queryCount;
      const uptime = (Date.now() - this.startTime) / 1000;
      const queriesPerSecond = this.queryCount / uptime;
      
      console.log(`[数据库监控] 查询次数: ${this.queryCount}, 平均查询时间: ${avgQueryTime.toFixed(2)}ms, QPS: ${queriesPerSecond.toFixed(2)}`);
    }
  }

  /**
   * 获取连接池状态
   */
  async getPoolStatus() {
    try {
      const status = await pool.getConnection();
      console.log('[数据库监控] 连接池状态: 正常');
      status.release();
    } catch (error) {
      console.error('[数据库监控] 连接池状态: 异常', error);
    }
  }
}

// 导出数据库监控实例
const dbMonitor = new DatabaseMonitor();

/**
 * 增强的查询方法，添加性能监控
 * @param {string} sql - SQL查询语句
 * @param {Array} params - 查询参数
 * @returns {Promise<Array>} 查询结果
 */
async function queryWithMonitoring(sql, params = []) {
  const startTime = Date.now();
  try {
    const result = await pool.query(sql, params);
    const duration = Date.now() - startTime;
    dbMonitor.recordQuery(sql, duration);
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('[数据库错误]', error, '查询:', sql, '参数:', params, '耗时:', duration, 'ms');
    throw error;
  }
}

// 定期检查连接池状态
setInterval(() => {
  dbMonitor.getPoolStatus();
}, 60000); // 每分钟检查一次

// 当直接运行此文件时，初始化数据库
if (require.main === module) {
  initializeDatabase()
    .then(() => {
      console.log('数据库初始化完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('数据库初始化失败:', error);
      process.exit(1);
    });
}

// 导出模块
module.exports = {
  pool, // 数据库连接池
  initializeDatabase, // 数据库初始化函数
  dbMonitor, // 数据库监控实例
  queryWithMonitoring // 增强的查询方法
};