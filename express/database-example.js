const { pool } = require('./config/database');

async function exampleUsage() {
  try {
    const connection = await pool.getConnection();
    
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT PRIMARY KEY AUTO_INCREMENT,
        username VARCHAR(50) NOT NULL,
        email VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✓ 创建 users 表成功');
    
    await connection.query(
      'INSERT INTO users (username, email) VALUES (?, ?)',
      ['testuser', 'test@example.com']
    );
    console.log('✓ 插入测试数据成功');
    
    const [rows] = await connection.query('SELECT * FROM users');
    console.log('✓ 查询数据成功:', rows);
    
    await connection.query('DROP TABLE IF EXISTS users');
    console.log('✓ 清理测试表成功');
    
    connection.release();
    console.log('\n✓ 所有数据库操作测试完成');
  } catch (error) {
    console.error('✗ 数据库操作失败:', error.message);
  }
}

exampleUsage();
