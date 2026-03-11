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
  
  // 创建巡检记录表
  var createInspectionTableSQL = `
    CREATE TABLE IF NOT EXISTS inspection_records (
      id INT AUTO_INCREMENT PRIMARY KEY,
      inspection_time DATETIME NOT NULL,
      inspector VARCHAR(100) NOT NULL,
      inspection_content TEXT NOT NULL,
      inspection_result ENUM('正常', '异常', '待处理') NOT NULL,
      problem_description TEXT,
      handling_status ENUM('未处理', '处理中', '已处理', '已关闭') DEFAULT '未处理',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_inspection_time (inspection_time),
      INDEX idx_inspector (inspector),
      INDEX idx_inspection_result (inspection_result),
      INDEX idx_handling_status (handling_status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `;
  
  connection.query(createInspectionTableSQL, function(err, result) {
    if (err) {
      console.error('创建巡检记录表失败: ' + err.message);
    } else {
      console.log('巡检记录表创建成功');
      
      // 创建系统日志表
      var createSystemLogTableSQL = `
        CREATE TABLE IF NOT EXISTS system_logs (
          id INT AUTO_INCREMENT PRIMARY KEY,
          log_time DATETIME NOT NULL,
          operator VARCHAR(100) NOT NULL,
          operation_type ENUM('登录', '登出', '添加', '修改', '删除', '查询', '其他') NOT NULL,
          operation_content TEXT NOT NULL,
          ip_address VARCHAR(50) NOT NULL,
          operation_result ENUM('成功', '失败', '警告') NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_log_time (log_time),
          INDEX idx_operator (operator),
          INDEX idx_operation_type (operation_type),
          INDEX idx_operation_result (operation_result)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `;
      
      connection.query(createSystemLogTableSQL, function(err, result) {
        if (err) {
          console.error('创建系统日志表失败: ' + err.message);
        } else {
          console.log('系统日志表创建成功');
        }
        
        // 查看巡检记录表结构
        connection.query('DESCRIBE inspection_records', function(err, fields) {
          if (err) {
            console.error('查看巡检记录表结构失败: ' + err.message);
          } else {
            console.log('\n巡检记录表结构:');
            console.table(fields);
          }
          
          // 查看系统日志表结构
          connection.query('DESCRIBE system_logs', function(err, fields) {
            if (err) {
              console.error('查看系统日志表结构失败: ' + err.message);
            } else {
              console.log('\n系统日志表结构:');
              console.table(fields);
            }
            connection.end();
          });
        });
      });
    }
  });
});
