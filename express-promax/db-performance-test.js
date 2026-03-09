/**
 * 数据库性能测试脚本
 * 功能：测试优化前后的数据库性能
 * 作者：系统生成
 * 创建日期：2026-03-09
 */

const { pool } = require('./db');

/**
 * 性能测试类
 */
class PerformanceTest {
  constructor() {
    this.results = [];
  }

  /**
   * 记录测试结果
   * @param {string} testName - 测试名称
   * @param {number} duration - 执行时间（毫秒）
   * @param {number} records - 处理记录数
   */
  recordResult(testName, duration, records = 1) {
    const throughput = records / (duration / 1000); // 每秒处理记录数
    this.results.push({
      testName,
      duration,
      records,
      throughput: throughput.toFixed(2)
    });
    console.log(`${testName}: ${duration}ms, ${records} records, ${throughput.toFixed(2)} records/s`);
  }

  /**
   * 执行测试
   * @param {string} testName - 测试名称
   * @param {Function} testFn - 测试函数
   * @param {number} records - 处理记录数
   */
  async runTest(testName, testFn, records = 1) {
    const startTime = Date.now();
    await testFn();
    const endTime = Date.now();
    this.recordResult(testName, endTime - startTime, records);
  }

  /**
   * 生成测试数据
   * @returns {Object} 传感器数据
   */
  generateSensorData() {
    return {
      type: "sensor_data",
      temperature: (20 + Math.random() * 15).toFixed(2),
      humidity: (40 + Math.random() * 30).toFixed(2),
      smoke_level: (Math.random() * 1).toFixed(2),
      max_temp: (25 + Math.random() * 10).toFixed(2),
      human_detected: Math.random() > 0.5 ? 1 : 0,
      fire_risk: Math.random() > 0.9 ? 1 : 0,
      env_status: Math.random() > 0.5 ? 1 : 0,
      battery: Math.floor(Math.random() * 100) + 1
    };
  }

  /**
   * 测试传感器数据插入性能
   * @param {number} count - 插入记录数
   */
  async testSensorDataInsert(count = 100) {
    const connection = await pool.getConnection();
    try {
      await this.runTest(
        `插入${count}条传感器数据`,
        async () => {
          for (let i = 0; i < count; i++) {
            const data = this.generateSensorData();
            await connection.query(
              `INSERT INTO sensor_data 
               (device_id, type, temperature, humidity, smoke_level, max_temp, human_detected, fire_risk, env_status, battery, timestamp) 
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
              [
                "sensor-001",
                data.type,
                data.temperature,
                data.humidity,
                data.smoke_level,
                data.max_temp,
                data.human_detected,
                data.fire_risk,
                data.env_status,
                data.battery
              ]
            );
          }
        },
        count
      );
    } finally {
      connection.release();
    }
  }

  /**
   * 测试传感器数据查询性能
   */
  async testSensorDataQuery() {
    const connection = await pool.getConnection();
    try {
      // 测试按设备ID查询
      await this.runTest(
        "按设备ID查询传感器数据",
        async () => {
          const [rows] = await connection.query(
            `SELECT * FROM sensor_data WHERE device_id = ? ORDER BY timestamp DESC LIMIT 10`,
            ["sensor-001"]
          );
        }
      );

      // 测试按时间范围查询
      await this.runTest(
        "按时间范围查询传感器数据",
        async () => {
          const [rows] = await connection.query(
            `SELECT * FROM sensor_data WHERE device_id = ? AND timestamp BETWEEN DATE_SUB(NOW(), INTERVAL 1 HOUR) AND NOW() ORDER BY timestamp DESC`,
            ["sensor-001"]
          );
        }
      );

      // 测试按火灾风险查询
      await this.runTest(
        "按火灾风险查询传感器数据",
        async () => {
          const [rows] = await connection.query(
            `SELECT * FROM sensor_data WHERE fire_risk = 1 ORDER BY timestamp DESC LIMIT 10`,
            ["sensor-001"]
          );
        }
      );
    } finally {
      connection.release();
    }
  }

  /**
   * 测试设备数据插入性能
   * @param {number} count - 插入记录数
   */
  async testDeviceDataInsert(count = 100) {
    const connection = await pool.getConnection();
    try {
      await this.runTest(
        `插入${count}条设备数据`,
        async () => {
          for (let i = 0; i < count; i++) {
            const data = {
              value: Math.random() * 100,
              unit: "Celsius",
              status: "normal"
            };
            await connection.query(
              `INSERT INTO device_data (device_id, timestamp, data_type, data) 
               VALUES (?, NOW(), ?, ?)`,
              [
                "sensor-001",
                "temperature",
                JSON.stringify(data)
              ]
            );
          }
        },
        count
      );
    } finally {
      connection.release();
    }
  }

  /**
   * 测试设备数据查询性能
   */
  async testDeviceDataQuery() {
    const connection = await pool.getConnection();
    try {
      // 测试按设备ID和数据类型查询
      await this.runTest(
        "按设备ID和数据类型查询设备数据",
        async () => {
          const [rows] = await connection.query(
            `SELECT * FROM device_data WHERE device_id = ? AND data_type = ? ORDER BY timestamp DESC LIMIT 10`,
            ["sensor-001", "temperature"]
          );
        }
      );
    } finally {
      connection.release();
    }
  }

  /**
   * 运行所有测试
   */
  async runAllTests() {
    console.log('开始数据库性能测试...');
    console.log('====================================');

    await this.testSensorDataInsert(100);
    await this.testSensorDataQuery();
    await this.testDeviceDataInsert(100);
    await this.testDeviceDataQuery();

    console.log('====================================');
    console.log('测试结果汇总:');
    console.table(this.results);

    // 关闭连接池
    await pool.end();
    console.log('测试完成，连接池已关闭');
  }
}

// 运行测试
const test = new PerformanceTest();
test.runAllTests();