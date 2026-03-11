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
  
  // 创建热成像传感器数据表
  var createTableSQL = `
    CREATE TABLE IF NOT EXISTS thermal (
      id INT AUTO_INCREMENT PRIMARY KEY,
      type VARCHAR(50) NOT NULL,
      temperature DECIMAL(5,2) NOT NULL,
      humidity DECIMAL(5,2) NOT NULL,
      smoke_level DECIMAL(3,2) NOT NULL,
      max_temp DECIMAL(5,2) NOT NULL,
      human_detected TINYINT NOT NULL,
      fire_risk TINYINT NOT NULL,
      env_status TINYINT NOT NULL,
      battery INT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `;
  
  connection.query(createTableSQL, function(err, result) {
    if (err) {
      console.error('创建表失败: ' + err.message);
    } else {
      console.log('热成像传感器数据表创建成功');
      
      // 插入数据
      var insertDataSQL = `
        INSERT INTO thermal_sensor_data (
          type, temperature, humidity, smoke_level, max_temp, 
          human_detected, fire_risk, env_status, battery
        ) VALUES (
          'sensor_data', 24.95, 51.96, 0.32, 26.00, 1, 0, 0, 100
        );
      `;
      
      connection.query(insertDataSQL, function(err, result) {
        if (err) {
          console.error('插入数据失败: ' + err.message);
        } else {
          console.log('数据插入成功，插入ID: ' + result.insertId);
          
          // 查看插入的数据
          connection.query('SELECT * FROM thermal_sensor_data ORDER BY id DESC LIMIT 1', function(err, results) {
            if (err) {
              console.error('查询数据失败: ' + err.message);
            } else {
              console.log('\n插入的数据:');
              console.table(results);
            }
            connection.end();
          });
        }
      });
    }
  });
});
