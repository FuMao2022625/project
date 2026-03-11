var mysql = require('mysql');

var connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '12305',
  database: 'express'
});

connection.connect(function(err) {
  if (err) {
    console.error('数据库连接失败: ' + err.stack);
    return;
  }
  console.log('数据库连接成功，连接ID: ' + connection.threadId);
  
  // 创建用户表
  var createTableSQL = `
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(20) NOT NULL,
      password VARCHAR(64) NOT NULL,
      email VARCHAR(100) NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      status TINYINT DEFAULT 1,
      UNIQUE KEY unique_username (username),
      UNIQUE KEY unique_email (email),
      CHECK (LENGTH(username) >= 4 AND LENGTH(username) <= 20),
      CHECK (LENGTH(password) >= 64),
      CHECK (email REGEXP '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$')
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `;
  
  connection.query(createTableSQL, function(err, result) {
    if (err) {
      console.error('创建表失败: ' + err.message);
    } else {
      console.log('用户表创建成功');
      
      // 查看表结构
      connection.query('DESCRIBE users', function(err, fields) {
        if (err) {
          console.error('查看表结构失败: ' + err.message);
        } else {
          console.log('\n表结构:');
          console.table(fields);
        }
        connection.end();
      });
    }
  });
});
