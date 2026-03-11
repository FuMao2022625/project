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
  
  // 创建机器人表
  var createTableSQL = `
    CREATE TABLE IF NOT EXISTS robots (
      robot_id VARCHAR(50) PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      model VARCHAR(50) NOT NULL,
      serial_number VARCHAR(50) NOT NULL,
      status ENUM('online', 'offline', 'maintenance', 'fault') NOT NULL,
      status_updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      location VARCHAR(255),
      responsible_person VARCHAR(100),
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY unique_serial_number (serial_number)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `;
  
  connection.query(createTableSQL, function(err, result) {
    if (err) {
      console.error('创建表失败: ' + err.message);
    } else {
      console.log('机器人表创建成功');
      
      // 创建索引
      var createIndexSQL = `
        CREATE INDEX idx_status ON robots(status);
      `;
      
      connection.query(createIndexSQL, function(err, result) {
        if (err) {
          console.error('创建索引失败: ' + err.message);
        } else {
          console.log('索引创建成功');
        }
        
        // 查看表结构
        connection.query('DESCRIBE robots', function(err, fields) {
          if (err) {
            console.error('查看表结构失败: ' + err.message);
          } else {
            console.log('\n表结构:');
            console.table(fields);
          }
          connection.end();
        });
      });
    }
  });
});
