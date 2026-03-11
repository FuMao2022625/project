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
  
  // 生成随机数据的函数
  function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
  
  function getRandomFloat(min, max, decimals) {
    return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
  }
  
  function getRandomString(length) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
  
  function getRandomEmail() {
    const domains = ['example.com', 'test.com', 'demo.com', 'sample.com'];
    return getRandomString(8) + '@' + domains[getRandomInt(0, domains.length - 1)];
  }
  
  function getRandomDateTime() {
    const now = new Date();
    const past = new Date(now.getTime() - getRandomInt(0, 30) * 24 * 60 * 60 * 1000);
    return past.toISOString().slice(0, 19).replace('T', ' ');
  }
  
  // 为users表生成数据
  function generateUsersData() {
    return new Promise((resolve, reject) => {
      const users = [];
      for (let i = 1; i <= 200; i++) {
        const username = 'user' + i + getRandomString(3);
        const password = 'a'.repeat(64); // 模拟哈希密码
        const email = 'user' + i + '@example.com';
        users.push([username, password, email]);
      }
      
      const sql = 'INSERT INTO users (username, password, email) VALUES ?';
      connection.query(sql, [users], function(err, result) {
        if (err) {
          reject(err);
        } else {
          console.log(`users表插入了 ${result.affectedRows} 条数据`);
          resolve();
        }
      });
    });
  }
  
  // 为thermal_sensor_data表生成数据
  function generateThermalSensorData() {
    return new Promise((resolve, reject) => {
      const data = [];
      for (let i = 1; i <= 200; i++) {
        const temperature = getRandomFloat(20, 30, 2);
        const humidity = getRandomFloat(40, 70, 2);
        const smokeLevel = getRandomFloat(0, 1, 2);
        const maxTemp = getRandomFloat(temperature, temperature + 5, 2);
        const humanDetected = getRandomInt(0, 1);
        const fireRisk = getRandomInt(0, 2);
        const envStatus = getRandomInt(0, 1);
        const battery = getRandomInt(50, 100);
        data.push(['sensor_data', temperature, humidity, smokeLevel, maxTemp, humanDetected, fireRisk, envStatus, battery]);
      }
      
      const sql = 'INSERT INTO thermal_sensor_data (type, temperature, humidity, smoke_level, max_temp, human_detected, fire_risk, env_status, battery) VALUES ?';
      connection.query(sql, [data], function(err, result) {
        if (err) {
          reject(err);
        } else {
          console.log(`thermal_sensor_data表插入了 ${result.affectedRows} 条数据`);
          resolve();
        }
      });
    });
  }
  
  // 为robots表生成数据
  function generateRobotsData() {
    return new Promise((resolve, reject) => {
      const robots = [];
      const statuses = ['online', 'offline', 'maintenance', 'fault'];
      const models = ['Model-A', 'Model-B', 'Model-C', 'Model-X', 'Model-Y'];
      
      for (let i = 1; i <= 200; i++) {
        const robotId = 'R' + String(i).padStart(4, '0');
        const name = '机器人' + i;
        const model = models[getRandomInt(0, models.length - 1)];
        const serialNumber = 'SN' + getRandomString(8);
        const status = statuses[getRandomInt(0, statuses.length - 1)];
        const location = '位置' + getRandomInt(1, 10);
        const responsiblePerson = '负责人' + getRandomInt(1, 50);
        const notes = '备注信息' + getRandomString(20);
        robots.push([robotId, name, model, serialNumber, status, location, responsiblePerson, notes]);
      }
      
      const sql = 'INSERT INTO robots (robot_id, name, model, serial_number, status, location, responsible_person, notes) VALUES ?';
      connection.query(sql, [robots], function(err, result) {
        if (err) {
          reject(err);
        } else {
          console.log(`robots表插入了 ${result.affectedRows} 条数据`);
          resolve();
        }
      });
    });
  }
  
  // 为environmental_monitoring表生成数据
  function generateEnvironmentalData() {
    return new Promise((resolve, reject) => {
      const data = [];
      const statuses = ['正常', '异常', '待验证'];
      const locations = ['车间A', '车间B', '仓库', '办公室', '实验室'];
      
      for (let i = 1; i <= 200; i++) {
        const sensorId = 'SENSOR' + String(i).padStart(4, '0');
        const temperature = getRandomFloat(20, 35, 2);
        const humidity = getRandomFloat(30, 80, 2);
        const flammableGas = getRandomFloat(0, 5, 3);
        const location = locations[getRandomInt(0, locations.length - 1)];
        const status = statuses[getRandomInt(0, statuses.length - 1)];
        const recordedAt = getRandomDateTime();
        data.push([sensorId, temperature, humidity, flammableGas, location, status, recordedAt]);
      }
      
      const sql = 'INSERT INTO environmental_monitoring (sensor_id, temperature, humidity, flammable_gas_ppm, location, status, recorded_at) VALUES ?';
      connection.query(sql, [data], function(err, result) {
        if (err) {
          reject(err);
        } else {
          console.log(`environmental_monitoring表插入了 ${result.affectedRows} 条数据`);
          resolve();
        }
      });
    });
  }
  
  // 为inspection_records表生成数据
  function generateInspectionRecords() {
    return new Promise((resolve, reject) => {
      const records = [];
      const results = ['正常', '异常', '待处理'];
      const handlingStatuses = ['未处理', '处理中', '已处理', '已关闭'];
      const inspectors = ['张三', '李四', '王五', '赵六', '钱七'];
      
      for (let i = 1; i <= 200; i++) {
        const inspectionTime = getRandomDateTime();
        const inspector = inspectors[getRandomInt(0, inspectors.length - 1)];
        const content = '巡检内容' + getRandomString(30);
        const result = results[getRandomInt(0, results.length - 1)];
        const problemDesc = result === '异常' ? '发现问题：' + getRandomString(50) : null;
        const handlingStatus = handlingStatuses[getRandomInt(0, handlingStatuses.length - 1)];
        records.push([inspectionTime, inspector, content, result, problemDesc, handlingStatus]);
      }
      
      const sql = 'INSERT INTO inspection_records (inspection_time, inspector, inspection_content, inspection_result, problem_description, handling_status) VALUES ?';
      connection.query(sql, [records], function(err, result) {
        if (err) {
          reject(err);
        } else {
          console.log(`inspection_records表插入了 ${result.affectedRows} 条数据`);
          resolve();
        }
      });
    });
  }
  
  // 为system_logs表生成数据
  function generateSystemLogs() {
    return new Promise((resolve, reject) => {
      const logs = [];
      const operationTypes = ['登录', '登出', '添加', '修改', '删除', '查询', '其他'];
      const results = ['成功', '失败', '警告'];
      const operators = ['admin', 'user1', 'user2', 'user3', 'user4'];
      
      for (let i = 1; i <= 200; i++) {
        const logTime = getRandomDateTime();
        const operator = operators[getRandomInt(0, operators.length - 1)];
        const operationType = operationTypes[getRandomInt(0, operationTypes.length - 1)];
        const content = '操作内容：' + getRandomString(50);
        const ip = '192.168.1.' + getRandomInt(1, 254);
        const result = results[getRandomInt(0, results.length - 1)];
        logs.push([logTime, operator, operationType, content, ip, result]);
      }
      
      const sql = 'INSERT INTO system_logs (log_time, operator, operation_type, operation_content, ip_address, operation_result) VALUES ?';
      connection.query(sql, [logs], function(err, result) {
        if (err) {
          reject(err);
        } else {
          console.log(`system_logs表插入了 ${result.affectedRows} 条数据`);
          resolve();
        }
      });
    });
  }
  
  // 验证数据
  function verifyData() {
    const tables = ['users', 'thermal_sensor_data', 'robots', 'environmental_monitoring', 'inspection_records', 'system_logs'];
    tables.forEach(table => {
      connection.query(`SELECT COUNT(*) as count FROM ${table}`, function(err, results) {
        if (err) {
          console.error(`查询${table}表失败: ${err.message}`);
        } else {
          console.log(`${table}表记录数: ${results[0].count}`);
        }
        if (table === tables[tables.length - 1]) {
          connection.end();
        }
      });
    });
  }
  
  // 执行数据生成
  generateUsersData()
    .then(generateThermalSensorData)
    .then(generateRobotsData)
    .then(generateEnvironmentalData)
    .then(generateInspectionRecords)
    .then(generateSystemLogs)
    .then(verifyData)
    .catch(err => {
      console.error('数据生成失败: ' + err.message);
      connection.end();
    });
});
