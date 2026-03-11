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
  
  // 创建环境监测表
  var createTableSQL = `
    CREATE TABLE IF NOT EXISTS environmental_monitoring (
      id INT AUTO_INCREMENT PRIMARY KEY,
      sensor_id VARCHAR(50) NOT NULL,
      temperature DECIMAL(5,2) NOT NULL,
      humidity DECIMAL(5,2) NOT NULL,
      flammable_gas_ppm DECIMAL(6,3) NOT NULL,
      location VARCHAR(255) NOT NULL,
      status ENUM('正常', '异常', '待验证') NOT NULL,
      recorded_at DATETIME NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY unique_sensor_time (sensor_id, recorded_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `;
  
  connection.query(createTableSQL, function(err, result) {
    if (err) {
      console.error('创建表失败: ' + err.message);
    } else {
      console.log('环境监测表创建成功');
      
      // 创建索引
      var createIndexesSQL = `
        CREATE INDEX idx_sensor_id ON environmental_monitoring(sensor_id);
        CREATE INDEX idx_recorded_at ON environmental_monitoring(recorded_at);
        CREATE INDEX idx_status ON environmental_monitoring(status);
      `;
      
      connection.query(createIndexesSQL, function(err, result) {
        if (err) {
          console.error('创建索引失败: ' + err.message);
        } else {
          console.log('索引创建成功');
        }
        
        // 查看表结构
        connection.query('DESCRIBE environmental_monitoring', function(err, fields) {
          if (err) {
            console.error('查看表结构失败: ' + err.message);
          } else {
            console.log('\n表结构:');
            console.table(fields);
            
            // 显示设计说明
            console.log('\n设计说明:');
            console.log('1. id: 自增主键，唯一标识每条记录');
            console.log('2. sensor_id: 传感器ID，字符串类型，确保唯一标识传感器');
            console.log('3. temperature: 温度，DECIMAL(5,2)类型，保留两位小数');
            console.log('4. humidity: 湿度，DECIMAL(5,2)类型，保留两位小数');
            console.log('5. flammable_gas_ppm: 易燃气体浓度，DECIMAL(6,3)类型，保留三位小数');
            console.log('6. location: 数据采集地点，字符串类型');
            console.log('7. status: 数据状态标识，枚举类型，确保数据一致性');
            console.log('8. recorded_at: 数据记录时间戳，精确到秒');
            console.log('9. created_at: 记录创建时间');
            console.log('10. updated_at: 记录更新时间');
            console.log('\n索引设计:');
            console.log('- sensor_id索引: 优化按传感器查询性能');
            console.log('- recorded_at索引: 优化按时间范围查询性能');
            console.log('- status索引: 优化按状态查询性能');
            console.log('- unique_sensor_time唯一键: 确保同一传感器在同一时间只有一条记录');
          }
          connection.end();
        });
      });
    }
  });
});
