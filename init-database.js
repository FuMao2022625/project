const mysql = require('mysql');

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '12305',
  charset: 'utf8mb4'
});

connection.connect(function(err) {
  if (err) {
    console.error('数据库连接失败:', err.message);
    process.exit(1);
  }
  
  console.log('数据库连接成功');
  
  connection.query('CREATE DATABASE IF NOT EXISTS thermal_sensor_data CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci', function(error) {
    if (error) {
      console.error('创建数据库失败:', error.message);
      connection.end();
      process.exit(1);
    }
    console.log('数据库创建/确认成功');
    
    connection.query('USE thermal_sensor_data', function(error) {
      if (error) {
        console.error('切换数据库失败:', error.message);
        connection.end();
        process.exit(1);
      }
      
      const createTableSQL = `CREATE TABLE IF NOT EXISTS thermal_sensor_data (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        sensor_type VARCHAR(50) NOT NULL COMMENT '传感器类型/设备ID',
        temperature DECIMAL(5, 2) NOT NULL COMMENT '当前温度（摄氏度）',
        humidity DECIMAL(5, 2) NOT NULL COMMENT '湿度（百分比）',
        smoke_level DECIMAL(5, 3) NOT NULL DEFAULT 0.000 COMMENT '烟雾级别',
        max_temp JSON NOT NULL COMMENT '最大温度矩阵（8x8二维数组）',
        human_detected BOOLEAN NOT NULL DEFAULT FALSE COMMENT '是否检测到人',
        fire_risk ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') NOT NULL DEFAULT 'LOW' COMMENT '火灾风险等级',
        env_status ENUM('NORMAL', 'WARNING', 'ALERT', 'EMERGENCY') NOT NULL DEFAULT 'NORMAL' COMMENT '环境状态',
        battery DECIMAL(5, 2) NOT NULL COMMENT '电池电量（百分比）',
        recorded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '数据记录时间',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '数据创建时间',
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '数据更新时间'
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='热成像传感器数据表'`;
      
      connection.query(createTableSQL, function(error) {
        if (error) {
          console.error('创建表失败:', error.message);
          connection.end();
          process.exit(1);
        }
        console.log('表结构创建/确认成功');
        
        const indexes = [
          'CREATE INDEX idx_sensor_type ON thermal_sensor_data(sensor_type)',
          'CREATE INDEX idx_recorded_at ON thermal_sensor_data(recorded_at)',
          'CREATE INDEX idx_fire_risk ON thermal_sensor_data(fire_risk)',
          'CREATE INDEX idx_env_status ON thermal_sensor_data(env_status)',
          'CREATE INDEX idx_human_detected ON thermal_sensor_data(human_detected)',
          'CREATE INDEX idx_sensor_time ON thermal_sensor_data(sensor_type, recorded_at DESC)'
        ];
        
        let indexIndex = 0;
        function createNextIndex() {
          if (indexIndex >= indexes.length) {
            console.log('所有索引创建完成');
            console.log('数据库初始化完成！');
            connection.end();
            process.exit(0);
          }
          
          connection.query(indexes[indexIndex], function(error) {
            if (error && !error.message.includes('duplicate')) {
              console.warn('创建索引警告:', error.message);
            }
            indexIndex++;
            createNextIndex();
          });
        }
        createNextIndex();
      });
    });
  });
});
