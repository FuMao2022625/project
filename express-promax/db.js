/**
 * 数据库连接与初始化模块
 * 功能：创建数据库连接池，初始化数据库结构，处理数据库错误
 * 作者：系统生成
 * 创建日期：2024-01-01
 * 主要修改记录：
 * 2024-01-01 - 初始化文件
 * 2026-03-07 - 添加设备表和设备数据表支持
 */

// 导入mysql2模块
const mysql = require('mysql2/promise');

/**
 * MySQL连接池配置
 * 用于管理数据库连接，提高性能和可靠性
 */
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost', // 数据库主机地址
  port: process.env.DB_PORT || 3306, // 数据库端口
  user: process.env.DB_USER || 'root', // 数据库用户名
  password: process.env.DB_PASSWORD || '12305', // 数据库密码
  database: process.env.DB_NAME || 'express_pro', // 数据库名称
  charset: 'utf8mb4', // 字符集
  waitForConnections: true, // 等待连接
  connectionLimit: 20, // 连接池大小
  queueLimit: 0, // 队列限制
  enableKeepAlive: true, // 启用连接保活
  keepAliveInitialDelay: 30000, // 30秒后开始保活
  connectTimeout: 10000, // 连接超时时间
  acquireTimeout: 10000 // 获取连接超时时间
});

/**
 * 初始化数据库
 * 功能：检查数据库是否存在，创建数据库，创建表结构
 * @returns {Promise<void>} - 初始化完成的Promise
 * @throws {Error} - 数据库初始化失败时抛出错误
 */
async function initializeDatabase() {
  let connection;
  try {
    // 首先不指定数据库连接，检查是否需要创建数据库
    const tempPool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '12305',
      charset: 'utf8mb4',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });
    
    connection = await tempPool.getConnection();
    
    // 检查数据库是否存在
    const [databases] = await connection.query(
      `SHOW DATABASES LIKE '${process.env.DB_NAME || 'express_pro'}'`
    );
    
    if (databases.length === 0) {
      // 如果数据库不存在则创建
      await connection.query(
        `CREATE DATABASE ${process.env.DB_NAME || 'express_pro'} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
      );
      console.log('数据库创建成功');
    }
    
    connection.release();
    tempPool.end();
    
    // 现在测试与实际数据库的连接
    const testConnection = await pool.getConnection();
    
    // 检查用户表是否存在
    const [tables] = await testConnection.query(
      "SHOW TABLES LIKE 'users'"
    );
    
    if (tables.length > 0) {
      // 表存在，检查是否需要添加新字段
      const [columns] = await testConnection.query(
        "SHOW COLUMNS FROM users"
      );
      
      const columnNames = columns.map(col => col.Field);
      
      // 如果status字段不存在，添加它
      if (!columnNames.includes('status')) {
        await testConnection.query(
          "ALTER TABLE users ADD COLUMN status ENUM('active', 'pending_deletion', 'deleted') DEFAULT 'active'"
        );
      }
      
      // 如果deactivated_at字段不存在，添加它
      if (!columnNames.includes('deactivated_at')) {
        await testConnection.query(
          "ALTER TABLE users ADD COLUMN deactivated_at TIMESTAMP NULL"
        );
      }
      
      // 如果deactivation_reason字段不存在，添加它
      if (!columnNames.includes('deactivation_reason')) {
        await testConnection.query(
          "ALTER TABLE users ADD COLUMN deactivation_reason VARCHAR(255) NULL"
        );
      }
    } else {
      // 表不存在，创建新表
      await testConnection.query(`
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
    
    // 删除所有其他表（如果存在） - 按依赖关系顺序删除
    const tablesToDelete = ['thermal_images', 'device_data', 'robots', 'environments', 'devices', 'images'];
    for (const table of tablesToDelete) {
      await testConnection.query(`DROP TABLE IF EXISTS ${table}`);
      console.log(`表 ${table} 已删除（如果存在）`);
    }
    
    // 创建设备表
    await testConnection.query(`
      CREATE TABLE devices (
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
    
    // 创建机器人表
    await testConnection.query(`
      CREATE TABLE robots (
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
    
    // 创建环境表
    await testConnection.query(`
      CREATE TABLE environments (
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
    
    // 创建热成像表
    await testConnection.query(`
      CREATE TABLE thermal_images (
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
    
    // 创建设备数据表
    await testConnection.query(`
      CREATE TABLE device_data (
        id INT AUTO_INCREMENT PRIMARY KEY,
        device_id VARCHAR(50) NOT NULL COMMENT '设备唯一标识',
        timestamp TIMESTAMP NOT NULL COMMENT '数据时间戳',
        data_type VARCHAR(50) NOT NULL COMMENT '数据类型',
        data JSON COMMENT '数据内容',
        received_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '接收时间',
        INDEX idx_device_id (device_id),
        INDEX idx_timestamp (timestamp),
        INDEX idx_data_type (data_type),
        FOREIGN KEY (device_id) REFERENCES devices(device_id) ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('设备数据表创建成功');
    
    console.log('数据库连接成功');
    testConnection.release();
    
  } catch (error) {
    console.error('数据库连接错误:', error);
    throw error;
  } finally {
    if (connection) {
      connection.release();
    }
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
exports = module.exports = {
  pool, // 数据库连接池
  initializeDatabase // 数据库初始化函数
};