const mysql = require('mysql2/promise');

const dbConfig = {
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: '12305',
  database: 'intelligent_inspection_system',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4'
};

const pool = mysql.createPool(dbConfig);

async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✓ 成功连接到 MySQL 数据库');
    console.log('✓ 数据库：intelligent_inspection_system');
    console.log('✓ 用户：root');
    console.log('✓ 主机：localhost:3306');
    
    const [rows] = await connection.query('SELECT 1 as result');
    console.log('✓ 数据库查询测试成功');
    
    connection.release();
    return true;
  } catch (error) {
    console.error('✗ 数据库连接失败:', error.message);
    return false;
  }
}

module.exports = { pool, testConnection };
