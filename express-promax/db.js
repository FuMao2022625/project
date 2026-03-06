const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '12305',
  database: process.env.DB_NAME || 'express_pro',
  charset: 'utf8mb4',
  waitForConnections: true,
  connectionLimit: 20, // 增加连接池大小以支持更多并发请求
  queueLimit: 0,
  enableKeepAlive: true, // 启用连接保活
  keepAliveInitialDelay: 30000, // 30秒后开始保活
  connectTimeout: 10000, // 连接超时时间
  acquireTimeout: 10000 // 获取连接超时时间
});

// 测试连接并在数据库不存在时创建
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
    
    // 首先删除可能存在的热成像表（因为它引用了其他表）
    await testConnection.query("DROP TABLE IF EXISTS thermal_images");
    console.log('热成像表已删除（如果存在）');
    
    // 检查机器人表是否存在
    const [robotTables] = await testConnection.query(
      "SHOW TABLES LIKE 'robots'"
    );
    
    if (robotTables.length > 0) {
      // 如果表存在，先删除
      await testConnection.query("DROP TABLE IF EXISTS robots");
      console.log('旧的机器人表已删除');
    }
    
    // 检查环境表是否存在
    const [environmentTables] = await testConnection.query(
      "SHOW TABLES LIKE 'environments'"
    );
    
    if (environmentTables.length > 0) {
      // 如果表存在，先删除
      await testConnection.query("DROP TABLE IF EXISTS environments");
      console.log('旧的环境表已删除');
    }
    
    // 创建机器人表
    await testConnection.query(`
      CREATE TABLE robots (
        id INT AUTO_INCREMENT PRIMARY KEY,
        robot_id VARCHAR(50) UNIQUE NOT NULL,
        model VARCHAR(100) NOT NULL,
        name VARCHAR(100) NOT NULL,
        status ENUM('在线', '离线', '维护中') DEFAULT '离线',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_robot_id (robot_id),
        INDEX idx_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('机器人表已创建');
    
    // 创建环境表
    await testConnection.query(`
      CREATE TABLE environments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        environment_id VARCHAR(50) UNIQUE NOT NULL,
        name VARCHAR(100) NOT NULL UNIQUE,
        longitude DECIMAL(10,6) NULL,
        latitude DECIMAL(10,6) NULL,
        type ENUM('室内', '室外', '工业车间') DEFAULT '室内',
        temperature DECIMAL(5,2) NULL,
        humidity DECIMAL(5,2) NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_environment_id (environment_id),
        INDEX idx_name (name),
        INDEX idx_location (longitude, latitude)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('环境表已创建');
    

    
    // 如果存在旧的images表，删除它
    const [oldImageTables] = await testConnection.query(
      "SHOW TABLES LIKE 'images'"
    );
    
    if (oldImageTables.length > 0) {
      await testConnection.query("DROP TABLE images");
      console.log('旧的成像表已删除');
    }
    
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

// 连接池错误处理
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

module.exports = {
  pool,
  initializeDatabase // 导出初始化函数
};