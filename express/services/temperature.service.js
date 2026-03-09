const { pool } = require('../config/database');

class TemperatureService {
  async getLatestTemperature(options = {}) {
    const {
      robot_id = null,
      task_id = null,
      precision = 2
    } = options;

    let sql = `
      SELECT 
        data_id,
        msg_id,
        robot_id,
        task_id,
        exec_id,
        data_time,
        temperature,
        humidity,
        smoke_level,
        max_temp,
        human_detected,
        fire_risk,
        env_status,
        battery
      FROM sensor_data
      WHERE 1=1
    `;
    
    const params = [];

    if (robot_id) {
      sql += ` AND robot_id = ?`;
      params.push(robot_id);
    }

    if (task_id) {
      sql += ` AND task_id = ?`;
      params.push(task_id);
    }

    sql += ` ORDER BY data_time DESC LIMIT 1`;

    const [rows] = await pool.query(sql, params);
    
    if (rows.length === 0) {
      return null;
    }

    return this.formatTemperatureData(rows[0], precision);
  }

  async getTemperatureHistory(options = {}) {
    const {
      robot_id = null,
      task_id = null,
      startTime = null,
      endTime = null,
      limit = 100,
      precision = 2
    } = options;

    let sql = `
      SELECT 
        data_id,
        msg_id,
        robot_id,
        task_id,
        exec_id,
        data_time,
        temperature,
        humidity,
        smoke_level,
        max_temp,
        human_detected,
        fire_risk,
        env_status,
        battery
      FROM sensor_data
      WHERE 1=1
    `;
    
    const params = [];

    if (robot_id) {
      sql += ` AND robot_id = ?`;
      params.push(robot_id);
    }

    if (task_id) {
      sql += ` AND task_id = ?`;
      params.push(task_id);
    }

    if (startTime) {
      sql += ` AND data_time >= ?`;
      params.push(startTime);
    }

    if (endTime) {
      sql += ` AND data_time <= ?`;
      params.push(endTime);
    }

    sql += ` ORDER BY data_time DESC LIMIT ?`;
    params.push(limit);

    const [rows] = await pool.query(sql, params);
    
    return rows.map(row => this.formatTemperatureData(row, precision));
  }

  formatTemperatureData(row, precision = 2) {
    const multiplier = Math.pow(10, precision);
    
    return {
      data_id: row.data_id,
      msg_id: row.msg_id,
      robot_id: row.robot_id,
      task_id: row.task_id,
      exec_id: row.exec_id,
      data_time: row.data_time,
      temperature: Math.round(row.temperature * multiplier) / multiplier,
      humidity: Math.round(row.humidity * multiplier) / multiplier,
      smoke_level: row.smoke_level,
      max_temp: Math.round(row.max_temp * multiplier) / multiplier,
      human_detected: row.human_detected,
      fire_risk: row.fire_risk,
      env_status: row.env_status,
      battery: row.battery,
      timestamp: new Date(row.data_time).getTime()
    };
  }

  validateQueryParams(params) {
    const errors = [];
    const warnings = [];

    if (params.robot_id) {
      const robotId = parseInt(params.robot_id);
      if (isNaN(robotId) || robotId <= 0) {
        errors.push('robot_id 必须是正整数');
      }
    }

    if (params.task_id) {
      const taskId = parseInt(params.task_id);
      if (isNaN(taskId) || taskId <= 0) {
        errors.push('task_id 必须是正整数');
      }
    }

    if (params.precision) {
      const precision = parseInt(params.precision);
      if (isNaN(precision) || precision < 0 || precision > 5) {
        errors.push('precision 必须在 0-5 之间');
      }
    }

    if (params.limit) {
      const limit = parseInt(params.limit);
      if (isNaN(limit) || limit <= 0 || limit > 1000) {
        errors.push('limit 必须在 1-1000 之间');
      }
    }

    if (params.interval) {
      const interval = parseInt(params.interval);
      if (isNaN(interval) || interval < 100 || interval > 60000) {
        errors.push('interval 必须在 100-60000 毫秒之间');
      }
    }

    if (params.startTime) {
      const start = new Date(params.startTime);
      if (isNaN(start.getTime())) {
        errors.push('startTime 必须是有效的日期格式');
      }
    }

    if (params.endTime) {
      const end = new Date(params.endTime);
      if (isNaN(end.getTime())) {
        errors.push('endTime 必须是有效的日期格式');
      }
    }

    if (params.startTime && params.endTime) {
      const start = new Date(params.startTime);
      const end = new Date(params.endTime);
      if (start > end) {
        errors.push('startTime 不能晚于 endTime');
      }
    }

    return { errors, warnings, isValid: errors.length === 0 };
  }

  async getTemperatureStats(options = {}) {
    const {
      robot_id = null,
      startTime = null,
      endTime = null
    } = options;

    let sql = `
      SELECT 
        COUNT(*) as total_count,
        AVG(temperature) as avg_temp,
        MIN(temperature) as min_temp,
        MAX(temperature) as max_temp,
        AVG(humidity) as avg_humidity
      FROM sensor_data
      WHERE 1=1
    `;
    
    const params = [];

    if (robot_id) {
      sql += ` AND robot_id = ?`;
      params.push(robot_id);
    }

    if (startTime) {
      sql += ` AND data_time >= ?`;
      params.push(startTime);
    }

    if (endTime) {
      sql += ` AND data_time <= ?`;
      params.push(endTime);
    }

    const [rows] = await pool.query(sql, params);
    
    if (rows.length === 0) {
      return null;
    }

    const stats = rows[0];
    return {
      total_count: stats.total_count,
      avg_temp: parseFloat(stats.avg_temp)?.toFixed(2) || 0,
      min_temp: parseFloat(stats.min_temp)?.toFixed(2) || 0,
      max_temp: parseFloat(stats.max_temp)?.toFixed(2) || 0,
      avg_humidity: parseFloat(stats.avg_humidity)?.toFixed(2) || 0
    };
  }

  async getTemperatureAlerts(options = {}) {
    const {
      robot_id = null,
      temp_threshold = 50,
      limit = 50
    } = options;

    let sql = `
      SELECT 
        data_id,
        robot_id,
        task_id,
        data_time,
        temperature,
        max_temp,
        fire_risk,
        env_status
      FROM sensor_data
      WHERE temperature > ? OR fire_risk > 0
    `;
    
    const params = [temp_threshold];

    if (robot_id) {
      sql += ` AND robot_id = ?`;
      params.push(robot_id);
    }

    sql += ` ORDER BY data_time DESC LIMIT ?`;
    params.push(limit);

    const [rows] = await pool.query(sql, params);
    
    return rows.map(row => ({
      data_id: row.data_id,
      robot_id: row.robot_id,
      task_id: row.task_id,
      data_time: row.data_time,
      temperature: row.temperature,
      max_temp: row.max_temp,
      fire_risk: row.fire_risk,
      env_status: row.env_status,
      alert_level: this.getAlertLevel(row.temperature, row.fire_risk),
      timestamp: new Date(row.data_time).getTime()
    }));
  }

  getAlertLevel(temperature, fire_risk) {
    if (fire_risk >= 3 || temperature >= 80) {
      return 'critical';
    } else if (fire_risk >= 2 || temperature >= 60) {
      return 'warning';
    } else if (fire_risk >= 1 || temperature >= 50) {
      return 'caution';
    }
    return 'normal';
  }
}

module.exports = new TemperatureService();
