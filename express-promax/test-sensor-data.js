/**
 * 传感器数据测试脚本
 * 功能：测试传感器数据表的插入和查询功能
 * 作者：系统生成
 * 创建日期：2026-03-09
 */

const { pool } = require('./db');

/**
 * 测试传感器数据插入和查询
 */
async function testSensorData() {
  let connection;
  try {
    // 获取数据库连接
    connection = await pool.getConnection();
    console.log('数据库连接成功');
    
    // 测试数据 - 嵌入式系统发送的传感器数据结构
    const sensorData = {
      type: "sensor_data",
      temperature: 24.81,
      humidity: 52.20,
      smoke_level: 0.32,
      max_temp: 25.50,
      human_detected: 1,
      fire_risk: 0,
      env_status: 0,
      battery: 100
    };
    
    // 设备ID（假设设备已存在）
    const deviceId = "sensor-001";
    
    // 1. 插入传感器数据
    console.log('\n1. 插入传感器数据...');
    const [insertResult] = await connection.query(
      `INSERT INTO sensor_data 
       (device_id, type, temperature, humidity, smoke_level, max_temp, human_detected, fire_risk, env_status, battery, timestamp) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        deviceId,
        sensorData.type,
        sensorData.temperature,
        sensorData.humidity,
        sensorData.smoke_level,
        sensorData.max_temp,
        sensorData.human_detected,
        sensorData.fire_risk,
        sensorData.env_status,
        sensorData.battery
      ]
    );
    
    console.log(`插入成功，ID: ${insertResult.insertId}`);
    
    // 2. 查询刚插入的数据
    console.log('\n2. 查询刚插入的数据...');
    const [rows] = await connection.query(
      `SELECT * FROM sensor_data WHERE id = ?`,
      [insertResult.insertId]
    );
    
    if (rows.length > 0) {
      const insertedData = rows[0];
      console.log('查询结果:');
      console.log(JSON.stringify(insertedData, null, 2));
      
      // 3. 验证数据是否正确
      console.log('\n3. 验证数据...');
      let isValid = true;
      
      if (insertedData.device_id !== deviceId) {
        console.error(`设备ID不匹配: 期望 ${deviceId}, 实际 ${insertedData.device_id}`);
        isValid = false;
      }
      
      if (insertedData.type !== sensorData.type) {
        console.error(`数据类型不匹配: 期望 ${sensorData.type}, 实际 ${insertedData.type}`);
        isValid = false;
      }
      
      if (parseFloat(insertedData.temperature) !== sensorData.temperature) {
        console.error(`温度不匹配: 期望 ${sensorData.temperature}, 实际 ${insertedData.temperature}`);
        isValid = false;
      }
      
      if (parseFloat(insertedData.humidity) !== sensorData.humidity) {
        console.error(`湿度不匹配: 期望 ${sensorData.humidity}, 实际 ${insertedData.humidity}`);
        isValid = false;
      }
      
      if (parseFloat(insertedData.smoke_level) !== sensorData.smoke_level) {
        console.error(`烟雾水平不匹配: 期望 ${sensorData.smoke_level}, 实际 ${insertedData.smoke_level}`);
        isValid = false;
      }
      
      if (parseFloat(insertedData.max_temp) !== sensorData.max_temp) {
        console.error(`最高温度不匹配: 期望 ${sensorData.max_temp}, 实际 ${insertedData.max_temp}`);
        isValid = false;
      }
      
      if (parseInt(insertedData.human_detected) !== sensorData.human_detected) {
        console.error(`人体检测不匹配: 期望 ${sensorData.human_detected}, 实际 ${insertedData.human_detected}`);
        isValid = false;
      }
      
      if (parseInt(insertedData.fire_risk) !== sensorData.fire_risk) {
        console.error(`火灾风险不匹配: 期望 ${sensorData.fire_risk}, 实际 ${insertedData.fire_risk}`);
        isValid = false;
      }
      
      if (parseInt(insertedData.env_status) !== sensorData.env_status) {
        console.error(`环境状态不匹配: 期望 ${sensorData.env_status}, 实际 ${insertedData.env_status}`);
        isValid = false;
      }
      
      if (parseInt(insertedData.battery) !== sensorData.battery) {
        console.error(`电池电量不匹配: 期望 ${sensorData.battery}, 实际 ${insertedData.battery}`);
        isValid = false;
      }
      
      if (isValid) {
        console.log('✅ 数据验证通过！');
      } else {
        console.log('❌ 数据验证失败！');
      }
      
    } else {
      console.error('❌ 查询失败，未找到插入的数据');
    }
    
    // 4. 测试索引查询性能
    console.log('\n4. 测试索引查询性能...');
    const startTime = Date.now();
    const [indexQueryResult] = await connection.query(
      `SELECT * FROM sensor_data WHERE device_id = ? ORDER BY timestamp DESC LIMIT 10`,
      [deviceId]
    );
    const endTime = Date.now();
    
    console.log(`索引查询耗时: ${endTime - startTime}ms`);
    console.log(`查询结果数量: ${indexQueryResult.length}`);
    
  } catch (error) {
    console.error('测试失败:', error);
  } finally {
    if (connection) {
      connection.release();
    }
    // 关闭连接池
    await pool.end();
    console.log('\n测试完成，连接池已关闭');
  }
}

// 运行测试
testSensorData();