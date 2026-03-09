/**
 * 设备初始化脚本
 * 功能：确保测试设备存在
 * 作者：系统生成
 * 创建日期：2026-03-09
 */

const { pool } = require('./db');

/**
 * 初始化测试设备
 */
async function initTestDevice() {
  let connection;
  try {
    // 获取数据库连接
    connection = await pool.getConnection();
    console.log('数据库连接成功');
    
    // 测试设备信息
    const deviceId = "sensor-001";
    const deviceName = "测试传感器";
    const deviceType = "temperature_sensor";
    
    // 检查设备是否存在
    const [existingDevices] = await connection.query(
      `SELECT * FROM devices WHERE device_id = ?`,
      [deviceId]
    );
    
    if (existingDevices.length > 0) {
      console.log(`设备 ${deviceId} 已存在，跳过创建`);
    } else {
      // 创建设备
      const [insertResult] = await connection.query(
        `INSERT INTO devices (device_id, name, type, status) VALUES (?, ?, ?, ?)`,
        [deviceId, deviceName, deviceType, 'online']
      );
      console.log(`设备 ${deviceId} 创建成功，ID: ${insertResult.insertId}`);
    }
    
  } catch (error) {
    console.error('设备初始化失败:', error);
  } finally {
    if (connection) {
      connection.release();
    }
    // 关闭连接池
    await pool.end();
    console.log('设备初始化完成，连接池已关闭');
  }
}

// 运行初始化
initTestDevice();