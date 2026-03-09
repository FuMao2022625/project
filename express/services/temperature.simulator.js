const { pool } = require('../config/database');

class TemperatureSimulator {
  constructor() {
    this.intervalId = null;
    this.isRunning = false;
    this.baseTemperature = 35;
    this.baseHumidity = 50;
    this.robotData = new Map();
  }

  initializeRobots(count = 10) {
    console.log(`初始化 ${count} 个机器人的模拟数据...`);
    
    for (let i = 1; i <= count; i++) {
      this.robotData.set(i, {
        temperature: this.baseTemperature + (Math.random() * 10 - 5),
        humidity: this.baseHumidity + (Math.random() * 20 - 10),
        smoke_level: Math.random() * 5,
        battery: Math.floor(Math.random() * 40) + 60,
        trend: Math.random() > 0.5 ? 1 : -1
      });
    }
    
    console.log('✓ 机器人数据初始化完成');
  }

  generateData(robotId) {
    const data = this.robotData.get(robotId);
    if (!data) return null;

    const changeRate = 0.3;
    data.temperature += (Math.random() - 0.5) * changeRate * 2;
    data.humidity += (Math.random() - 0.5) * changeRate * 10;
    
    if (data.temperature > 50) data.trend = -1;
    if (data.temperature < 25) data.trend = 1;
    data.temperature += data.trend * 0.1;

    data.temperature = Math.max(20, Math.min(55, data.temperature));
    data.humidity = Math.max(30, Math.min(80, data.humidity));
    data.smoke_level = Math.max(0, Math.min(10, data.smoke_level + (Math.random() - 0.5)));

    const fireRisk = data.temperature > 50 ? Math.floor((data.temperature - 50) / 10) + 1 : 0;
    const envStatus = data.temperature > 45 || data.smoke_level > 8 ? 1 : 0;

    return {
      robot_id: robotId,
      temperature: parseFloat(data.temperature.toFixed(2)),
      humidity: parseFloat(data.humidity.toFixed(2)),
      smoke_level: parseFloat(data.smoke_level.toFixed(3)),
      max_temp: parseFloat((data.temperature + Math.random() * 5).toFixed(2)),
      fire_risk: fireRisk,
      env_status: envStatus,
      battery: data.battery,
      human_detected: Math.random() > 0.9 ? 1 : 0
    };
  }

  async insertToDatabase(sensorData) {
    const sql = `
      INSERT INTO sensor_data (
        msg_id, robot_id, task_id, exec_id, 
        data_time, temperature, humidity, smoke_level, 
        max_temp, human_detected, fire_risk, env_status, battery
      ) VALUES (?, ?, ?, ?, NOW(3), ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const msgId = Date.now() * 1000 + sensorData.robot_id;
    const taskId = Math.floor(Math.random() * 200) + 1;
    const execId = Math.floor(Math.random() * 200) + 1;

    try {
      await pool.query(sql, [
        msgId,
        sensorData.robot_id,
        taskId,
        execId,
        sensorData.temperature,
        sensorData.humidity,
        sensorData.smoke_level,
        sensorData.max_temp,
        sensorData.human_detected,
        sensorData.fire_risk,
        sensorData.env_status,
        sensorData.battery
      ]);

      // 只在开发模式下详细日志
      if (process.env.NODE_ENV === 'development') {
        console.log(`✓ 插入数据：机器人${sensorData.robot_id}, 温度：${sensorData.temperature}°C`);
      }
      return true;
    } catch (error) {
      console.error('插入数据失败:', error.message);
      return false;
    }
  }

  async generateAndInsert() {
    const robotIds = Array.from(this.robotData.keys());
    const selectedRobotId = robotIds[Math.floor(Math.random() * robotIds.length)];
    
    const sensorData = this.generateData(selectedRobotId);
    if (sensorData) {
      await this.insertToDatabase(sensorData);
    }
  }

  start(interval = 2000) {
    if (this.isRunning) {
      console.log('模拟器已在运行中');
      return;
    }

    this.isRunning = true;
    this.initializeRobots(10);
    
    console.log(`🌡️ 温度数据模拟器已启动，生成间隔：${interval}ms`);
    
    this.intervalId = setInterval(() => {
      this.generateAndInsert();
    }, interval);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      this.isRunning = false;
      console.log('⏹️ 温度数据模拟器已停止');
    }
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      robotCount: this.robotData.size,
      robots: Array.from(this.robotData.entries()).map(([id, data]) => ({
        robot_id: id,
        current_temp: data.temperature.toFixed(2),
        current_humidity: data.humidity.toFixed(2)
      }))
    };
  }

  getLatestData(robotId) {
    return this.robotData.get(robotId);
  }
}

module.exports = new TemperatureSimulator();
