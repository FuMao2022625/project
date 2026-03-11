const fs = require('fs');
const path = require('path');
const dataProcessor = require('./data-processor');

function saveRawData(rawData, processingId, clientInfo) {
  const filename = `raw_${processingId}.txt`;
  const filepath = path.join(dataProcessor.RAW_DATA_DIR, filename);
  
  const content = `处理ID: ${processingId}
客户端: ${clientInfo}
时间: ${new Date().toISOString()}
原始数据:
${rawData}
`;
  
  fs.writeFileSync(filepath, content, 'utf8');
  dataProcessor.log('INFO', `原始数据已保存: ${filename}`);
}

function saveProcessedData(data, processingId) {
  const filename = `processed_${processingId}.json`;
  const filepath = path.join(dataProcessor.PROCESSED_DATA_DIR, filename);
  
  const content = JSON.stringify(data, null, 2);
  fs.writeFileSync(filepath, content, 'utf8');
  dataProcessor.log('INFO', `处理后数据已保存: ${filename}`);
}

function saveToDatabase(data, processingId) {
  return new Promise((resolve, reject) => {
    const dbConnection = dataProcessor.getDbConnection();
    
    if (!dbConnection) {
      dataProcessor.log('WARN', `数据库未连接，跳过数据库存储 [ID: ${processingId}]`);
      resolve(null);
      return;
    }
    
    const sql = `INSERT INTO thermal_sensor_data 
      (sensor_type, temperature, humidity, smoke_level, max_temp, human_detected, fire_risk, env_status, battery, recorded_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    
    const values = [
      data.sensor_type,
      data.temperature,
      data.humidity,
      data.smoke_level,
      data.max_temp,
      data.human_detected,
      data.fire_risk,
      data.env_status,
      data.battery,
      data.recorded_at
    ];
    
    dbConnection.query(sql, values, function(error, results) {
      if (error) {
        dataProcessor.log('ERROR', `数据库插入失败 [ID: ${processingId}]: ${error.message}`);
        reject(error);
      } else {
        dataProcessor.log('INFO', `数据已存入数据库 [ID: ${processingId}], 记录ID: ${results.insertId}`);
        resolve(results);
      }
    });
  });
}

module.exports = {
  saveRawData,
  saveProcessedData,
  saveToDatabase
};
