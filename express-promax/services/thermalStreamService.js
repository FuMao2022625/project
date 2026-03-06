

// 热成像数据流服务
class ThermalStreamService {
  constructor() {
    this.isStreaming = false;
    this.streamInterval = null;
    this.activeRobots = new Set();
    this.activeEnvironments = new Set();
  }

  // 热成像数据格式定义
  static getThermalDataFormat() {
    return {
      // 基础信息
      type: 'thermal_data',
      timestamp: '', // ISO 8601格式时间戳
      sequence: 0, // 数据序列号
      
      // 设备信息
      robotId: '',
      robotName: '',
      environmentId: '',
      environmentName: '',
      
      // 热成像数据
      thermalData: {
        width: 0, // 图像宽度
        height: 0, // 图像高度
        minTemperature: 0, // 最低温度
        maxTemperature: 0, // 最高温度
        avgTemperature: 0, // 平均温度
        temperatureMatrix: [], // 温度矩阵数据
        hotspots: [] // 热点坐标
      },
      
      // 坐标信息
      coordinates: {
        longitude: 0, // 经度
        latitude: 0, // 纬度
        altitude: 0, // 海拔
        orientation: 0 // 方向角
      },
      
      // 状态信息
      status: {
        batteryLevel: 0, // 电池电量
        signalStrength: 0, // 信号强度
        connectionQuality: 0 // 连接质量
      },
      
      // 压缩信息
      compression: {
        algorithm: 'none', // 压缩算法
        ratio: 1.0, // 压缩比
        originalSize: 0, // 原始大小
        compressedSize: 0 // 压缩后大小
      }
    };
  }

  // 生成模拟热成像数据
  generateThermalData(robotId, environmentId) {
    const baseFormat = this.constructor.getThermalDataFormat();
    const timestamp = new Date().toISOString();
    
    // 模拟热成像数据 (16x12像素)
    const width = 16;
    const height = 12;
    const temperatureMatrix = [];
    
    // 生成温度矩阵
    for (let y = 0; y < height; y++) {
      const row = [];
      for (let x = 0; x < width; x++) {
        // 基础温度 + 随机波动 + 热点模拟
        let temperature = 20 + Math.random() * 15;
        
        // 模拟热点 (随机位置)
        if (Math.random() < 0.05) {
          temperature += 10 + Math.random() * 20;
        }
        
        row.push(parseFloat(temperature.toFixed(2)));
      }
      temperatureMatrix.push(row);
    }
    
    // 计算温度统计
    const flatMatrix = temperatureMatrix.flat();
    const minTemperature = Math.min(...flatMatrix);
    const maxTemperature = Math.max(...flatMatrix);
    const avgTemperature = flatMatrix.reduce((a, b) => a + b, 0) / flatMatrix.length;
    
    // 检测热点
    const hotspots = [];
    const hotspotThreshold = avgTemperature + 5;
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (temperatureMatrix[y][x] > hotspotThreshold) {
          hotspots.push({
            x: x,
            y: y,
            temperature: temperatureMatrix[y][x]
          });
        }
      }
    }
    
    // 构建完整数据对象
    const thermalData = {
      ...baseFormat,
      type: 'thermal_data',
      timestamp: timestamp,
      sequence: Date.now(),
      robotId: robotId || `robot_${Math.floor(Math.random() * 1000)}`,
      robotName: `机器人 ${robotId?.split('_')[1] || '模拟'}`,
      environmentId: environmentId || `env_${Math.floor(Math.random() * 100)}`,
      environmentName: `环境 ${environmentId?.split('_')[1] || '模拟'}`,
      thermalData: {
        width: width,
        height: height,
        minTemperature: parseFloat(minTemperature.toFixed(2)),
        maxTemperature: parseFloat(maxTemperature.toFixed(2)),
        avgTemperature: parseFloat(avgTemperature.toFixed(2)),
        temperatureMatrix: temperatureMatrix,
        hotspots: hotspots.slice(0, 5) // 限制热点数量
      },
      coordinates: {
        longitude: 116.3974 + (Math.random() - 0.5) * 0.01, // 北京附近
        latitude: 39.9093 + (Math.random() - 0.5) * 0.01,
        altitude: 50 + Math.random() * 100,
        orientation: Math.random() * 360
      },
      status: {
        batteryLevel: Math.floor(20 + Math.random() * 80),
        signalStrength: Math.floor(60 + Math.random() * 40),
        connectionQuality: Math.floor(70 + Math.random() * 30)
      },
      compression: {
        algorithm: 'gzip',
        ratio: parseFloat((0.3 + Math.random() * 0.5).toFixed(2)),
        originalSize: width * height * 4, // 假设每个温度值4字节
        compressedSize: Math.floor(width * height * 4 * (0.3 + Math.random() * 0.5))
      }
    };
    
    return thermalData;
  }

  // 压缩热成像数据
  compressThermalData(data) {
    // 第一层压缩：移除冗余信息，只保留必要数据
    const compressed = {
      t: data.timestamp,
      seq: data.sequence,
      rid: data.robotId,
      eid: data.environmentId,
      td: {
        w: data.thermalData.width,
        h: data.thermalData.height,
        min: data.thermalData.minTemperature,
        max: data.thermalData.maxTemperature,
        avg: data.thermalData.avgTemperature,
        // 简化温度矩阵传输
        matrix: data.thermalData.temperatureMatrix.flat(),
        hs: data.thermalData.hotspots.map(hs => ({
          x: hs.x,
          y: hs.y,
          t: hs.temperature
        }))
      },
      coord: data.coordinates,
      stat: data.status,
      comp: data.compression
    };
    
    // 第二层压缩：数值精度优化
    this.optimizePrecision(compressed);
    
    // 第三层压缩：差分编码（如果适用）
    if (this.lastCompressedData) {
      compressed.td.matrix = this.differentialEncode(compressed.td.matrix, this.lastCompressedData.td.matrix);
    }
    
    this.lastCompressedData = compressed;
    
    return compressed;
  }

  // 数值精度优化
  optimizePrecision(data) {
    // 温度值保留1位小数
    if (data.td.min) data.td.min = parseFloat(data.td.min.toFixed(1));
    if (data.td.max) data.td.max = parseFloat(data.td.max.toFixed(1));
    if (data.td.avg) data.td.avg = parseFloat(data.td.avg.toFixed(1));
    
    // 热点温度保留1位小数
    if (data.td.hs) {
      data.td.hs.forEach(hs => {
        if (hs.t) hs.t = parseFloat(hs.t.toFixed(1));
      });
    }
    
    // 坐标精度优化
    if (data.coord.longitude) data.coord.longitude = parseFloat(data.coord.longitude.toFixed(6));
    if (data.coord.latitude) data.coord.latitude = parseFloat(data.coord.latitude.toFixed(6));
    if (data.coord.altitude) data.coord.altitude = parseFloat(data.coord.altitude.toFixed(1));
    if (data.coord.orientation) data.coord.orientation = parseFloat(data.coord.orientation.toFixed(1));
  }

  // 差分编码
  differentialEncode(currentMatrix, previousMatrix) {
    if (!previousMatrix || currentMatrix.length !== previousMatrix.length) {
      return currentMatrix; // 无法差分编码，返回原始数据
    }
    
    const diffMatrix = [];
    for (let i = 0; i < currentMatrix.length; i++) {
      const diff = currentMatrix[i] - previousMatrix[i];
      // 如果变化很小，可以进一步优化
      if (Math.abs(diff) < 0.5) {
        diffMatrix.push(0); // 表示无变化
      } else {
        diffMatrix.push(parseFloat(diff.toFixed(1)));
      }
    }
    
    return diffMatrix;
  }

  // 差分解码（前端使用）
  static differentialDecode(diffMatrix, previousMatrix) {
    if (!previousMatrix || diffMatrix.length !== previousMatrix.length) {
      return diffMatrix; // 无法差分解码，返回原始数据
    }
    
    const currentMatrix = [];
    for (let i = 0; i < diffMatrix.length; i++) {
      if (diffMatrix[i] === 0) {
        currentMatrix.push(previousMatrix[i]);
      } else {
        currentMatrix.push(previousMatrix[i] + diffMatrix[i]);
      }
    }
    
    return currentMatrix;
  }

  // 开始数据流
  startStreaming(robotId = null, environmentId = null) {
    if (this.isStreaming) {
      console.log('热成像数据流已在运行中');
      return;
    }

    this.isStreaming = true;
    
    if (robotId) {
      this.activeRobots.add(robotId);
    }
    
    if (environmentId) {
      this.activeEnvironments.add(environmentId);
    }

    console.log('开始热成像数据流传输...');
    
    this.streamInterval = setInterval(() => {
      try {
        // 为每个活跃的机器人或环境生成数据
        if (this.activeRobots.size > 0) {
          this.activeRobots.forEach(robotId => {
            const thermalData = this.generateThermalData(robotId, null);
            const compressedData = this.compressThermalData(thermalData);
            // 生成数据但不发送（SSE功能已移除）
            console.log(`生成机器人 ${robotId} 的热成像数据`);
          });
        }
        
        if (this.activeEnvironments.size > 0) {
          this.activeEnvironments.forEach(environmentId => {
            const thermalData = this.generateThermalData(null, environmentId);
            const compressedData = this.compressThermalData(thermalData);
            // 生成数据但不发送（SSE功能已移除）
            console.log(`生成环境 ${environmentId} 的热成像数据`);
          });
        }
        
        // 如果没有特定订阅，生成通用数据
        if (this.activeRobots.size === 0 && this.activeEnvironments.size === 0) {
          const thermalData = this.generateThermalData();
          const compressedData = this.compressThermalData(thermalData);
          // 生成数据但不发送（SSE功能已移除）
          console.log('生成通用热成像数据');
        }
        
      } catch (error) {
        console.error('热成像数据流错误:', error);
      }
    }, 1000); // 每秒生成一次数据
  }

  // 停止数据流
  stopStreaming() {
    if (!this.isStreaming) {
      console.log('热成像数据流未在运行');
      return;
    }

    this.isStreaming = false;
    
    if (this.streamInterval) {
      clearInterval(this.streamInterval);
      this.streamInterval = null;
    }
    
    this.activeRobots.clear();
    this.activeEnvironments.clear();
    
    console.log('热成像数据流已停止');
  }

  // 添加机器人到数据流
  addRobotToStream(robotId) {
    this.activeRobots.add(robotId);
    console.log(`机器人 ${robotId} 已添加到数据流`);
  }

  // 从数据流中移除机器人
  removeRobotFromStream(robotId) {
    this.activeRobots.delete(robotId);
    console.log(`机器人 ${robotId} 已从数据流中移除`);
  }

  // 添加环境到数据流
  addEnvironmentToStream(environmentId) {
    this.activeEnvironments.add(environmentId);
    console.log(`环境 ${environmentId} 已添加到数据流`);
  }

  // 从数据流中移除环境
  removeEnvironmentFromStream(environmentId) {
    this.activeEnvironments.delete(environmentId);
    console.log(`环境 ${environmentId} 已从数据流中移除`);
  }

  // 获取流状态
  getStreamStatus() {
    return {
      isStreaming: this.isStreaming,
      activeRobots: Array.from(this.activeRobots),
      activeEnvironments: Array.from(this.activeEnvironments),
      interval: this.streamInterval ? '运行中' : '已停止'
    };
  }
}

// 创建单例实例
const thermalStreamService = new ThermalStreamService();

module.exports = thermalStreamService;