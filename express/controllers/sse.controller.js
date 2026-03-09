const sseService = require('../services/sse.service');
const temperatureService = require('../services/temperature.service');

class SSEController {
  async connectTemperatureStream(req, res) {
    const {
      robot_id,
      task_id,
      interval = 1000,
      precision = 2,
      include_humidity = true,
      include_alerts = false
    } = req.query;

    const validation = temperatureService.validateQueryParams({
      robot_id,
      task_id,
      precision,
      interval
    });

    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: '参数验证失败',
        errors: validation.errors
      });
    }

    const options = {
      robot_id: robot_id ? parseInt(robot_id) : null,
      task_id: task_id ? parseInt(task_id) : null,
      precision: parseInt(precision) || 2,
      interval: parseInt(interval) || 1000,
      include_humidity: include_humidity === 'true',
      include_alerts: include_alerts === 'true'
    };

    const clientId = sseService.addClient(res, options);
    sseService.startHeartbeat(clientId, 30000);

    const initialData = await temperatureService.getLatestTemperature({
      robot_id: options.robot_id,
      task_id: options.task_id,
      precision: options.precision
    });

    if (initialData) {
      sseService.sendToClient(clientId, {
        type: 'initial_data',
        data: initialData,
        timestamp: new Date().toISOString()
      });
    }

    const dataInterval = setInterval(async () => {
      try {
        const latestData = await temperatureService.getLatestTemperature({
          robot_id: options.robot_id,
          task_id: options.task_id,
          precision: options.precision
        });

        if (latestData) {
          const message = {
            type: 'temperature_update',
            data: latestData,
            timestamp: new Date().toISOString()
          };

          if (options.include_alerts) {
            const alerts = await temperatureService.getTemperatureAlerts({
              robot_id: options.robot_id,
              limit: 5
            });
            message.alerts = alerts;
          }

          sseService.sendToClient(clientId, message);
        }
      } catch (error) {
        console.error('获取温度数据失败:', error);
        sseService.sendToClient(clientId, {
          type: 'error',
          message: '获取温度数据失败',
          timestamp: new Date().toISOString()
        });
      }
    }, options.interval);

    sseService.getClientInfo(clientId).cleanupInterval = dataInterval;

    res.on('close', () => {
      if (dataInterval) {
        clearInterval(dataInterval);
      }
    });
  }

  async getTemperatureHistory(req, res) {
    try {
      const {
        robot_id,
        task_id,
        startTime,
        endTime,
        limit = 100,
        precision = 2
      } = req.query;

      const validation = temperatureService.validateQueryParams({
        robot_id,
        task_id,
        limit,
        precision,
        startTime,
        endTime
      });

      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: '参数验证失败',
          errors: validation.errors
        });
      }

      const options = {
        robot_id: robot_id ? parseInt(robot_id) : null,
        task_id: task_id ? parseInt(task_id) : null,
        startTime: startTime ? new Date(startTime) : null,
        endTime: endTime ? new Date(endTime) : null,
        limit: parseInt(limit) || 100,
        precision: parseInt(precision) || 2
      };

      const history = await temperatureService.getTemperatureHistory(options);

      res.json({
        success: true,
        data: history,
        count: history.length,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('获取温度历史数据失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  async getTemperatureStats(req, res) {
    try {
      const {
        robot_id,
        startTime,
        endTime
      } = req.query;

      const options = {
        robot_id: robot_id ? parseInt(robot_id) : null,
        startTime: startTime ? new Date(startTime) : null,
        endTime: endTime ? new Date(endTime) : null
      };

      const stats = await temperatureService.getTemperatureStats(options);

      res.json({
        success: true,
        data: stats,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('获取温度统计数据失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  async getTemperatureAlerts(req, res) {
    try {
      const {
        robot_id,
        temp_threshold = 50,
        limit = 50
      } = req.query;

      const options = {
        robot_id: robot_id ? parseInt(robot_id) : null,
        temp_threshold: parseFloat(temp_threshold) || 50,
        limit: parseInt(limit) || 50
      };

      const alerts = await temperatureService.getTemperatureAlerts(options);

      res.json({
        success: true,
        data: alerts,
        count: alerts.length,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('获取温度告警失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  getConnectionStatus(req, res) {
    const clients = sseService.getAllClients();
    
    res.json({
      success: true,
      data: {
        total_connections: sseService.getClientCount(),
        clients,
        timestamp: new Date().toISOString()
      }
    });
  }

  disconnectClient(req, res) {
    const { clientId } = req.params;
    
    const client = sseService.getClientInfo(clientId);
    if (!client) {
      return res.status(404).json({
        success: false,
        message: '客户端不存在'
      });
    }

    if (client.cleanupInterval) {
      clearInterval(client.cleanupInterval);
    }

    sseService.removeClient(clientId);

    res.json({
      success: true,
      message: '客户端已断开连接',
      timestamp: new Date().toISOString()
    });
  }
}

module.exports = new SSEController();
