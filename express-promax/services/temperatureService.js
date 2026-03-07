// 温度数据采集服务
class TemperatureService {
  constructor() {
    this.isCollecting = false;
    this.collectInterval = null;
    this.currentTemperature = 20.0; // 默认温度
    this.minTemp = 15.0;
    this.maxTemp = 35.0;
    this.listeners = new Set();
    this.lastCleanup = Date.now();
    this.cleanupInterval = 5 * 60 * 1000; // 5分钟清理一次
    this.maxListeners = 1000; // 最大监听器数量
    this.dataHistory = []; // 数据历史缓存
    this.maxHistorySize = 1000; // 最大历史数据条数
  }

  // 生成模拟温度数据
  generateTemperature() {
    // 模拟温度变化，添加一些随机波动
    const variation = (Math.random() - 0.5) * 2; // -1 到 1 的变化
    this.currentTemperature += variation;
    
    // 确保温度在合理范围内
    this.currentTemperature = Math.max(this.minTemp, Math.min(this.maxTemp, this.currentTemperature));
    
    // 添加一些周期性变化（模拟日夜温差）
    const hour = new Date().getHours();
    const dailyVariation = Math.sin((hour / 24) * 2 * Math.PI) * 3;
    this.currentTemperature += dailyVariation * 0.1;
    
    return parseFloat(this.currentTemperature.toFixed(2));
  }

  // 开始温度采集
  startCollection(interval = 2000) {
    if (this.isCollecting) {
      console.log('温度采集已在运行中');
      return;
    }

    this.isCollecting = true;
    console.log(`开始温度采集，间隔: ${interval}ms`);
    
    this.collectInterval = setInterval(() => {
      try {
        const temperature = this.generateTemperature();
        const timestamp = new Date().toISOString();
        
        // 通知所有监听器
        this.notifyListeners({
          value: temperature,
          timestamp: timestamp
        });
        
        console.log(`温度数据生成: ${temperature}°C at ${timestamp}`);
      } catch (error) {
        console.error('温度采集错误:', error);
      }
    }, interval);
  }

  // 停止温度采集
  stopCollection() {
    if (!this.isCollecting) {
      console.log('温度采集未在运行');
      return;
    }

    this.isCollecting = false;
    
    if (this.collectInterval) {
      clearInterval(this.collectInterval);
      this.collectInterval = null;
    }
    
    console.log('温度采集已停止');
  }

  // 添加监听器
  addListener(listener) {
    // 防止内存泄漏：限制监听器数量
    if (this.listeners.size >= this.maxListeners) {
      console.warn(`监听器数量达到上限 (${this.maxListeners})，拒绝添加新监听器`);
      return false;
    }
    
    this.listeners.add(listener);
    
    // 定期清理
    this.performCleanup();
    
    return true;
  }

  // 移除监听器
  removeListener(listener) {
    const result = this.listeners.delete(listener);
    this.performCleanup();
    return result;
  }

  // 执行清理操作
  performCleanup() {
    const now = Date.now();
    
    // 每5分钟执行一次完整清理
    if (now - this.lastCleanup > this.cleanupInterval) {
      this.lastCleanup = now;
      
      // 清理历史数据
      if (this.dataHistory.length > this.maxHistorySize) {
        this.dataHistory = this.dataHistory.slice(-this.maxHistorySize / 2);
      }
      
      // 清理无效的监听器
      const validListeners = new Set();
      for (const listener of this.listeners) {
        if (typeof listener === 'function') {
          validListeners.add(listener);
        }
      }
      this.listeners = validListeners;
      
      console.log(`清理完成: 有效监听器数量 = ${this.listeners.size}`);
    }
  }

  // 通知所有监听器
  notifyListeners(data) {
    // 添加到历史数据
    this.dataHistory.push({
      ...data,
      receivedAt: Date.now()
    });
    
    // 限制历史数据大小
    if (this.dataHistory.length > this.maxHistorySize) {
      this.dataHistory.shift();
    }
    
    // 使用异步方式通知监听器，避免阻塞
    const listeners = Array.from(this.listeners);
    listeners.forEach(listener => {
      try {
        // 使用setImmediate避免长时间运行的监听器阻塞主循环
        setImmediate(() => {
          try {
            listener(data);
          } catch (error) {
            console.error('监听器执行错误:', error);
            // 如果监听器持续出错，考虑移除它
            if (this.shouldRemoveListener(error)) {
              this.listeners.delete(listener);
              console.warn('移除了出错的监听器');
            }
          }
        });
      } catch (error) {
        console.error('监听器调度错误:', error);
      }
    });
  }

  // 判断是否应该移除出错的监听器
  shouldRemoveListener(error) {
    // 这里可以根据错误类型和频率来决定是否移除监听器
    // 简单的实现：总是移除出错的监听器
    return true;
  }

  // 获取当前温度
  getCurrentTemperature() {
    return {
      value: parseFloat(this.currentTemperature.toFixed(2)),
      timestamp: new Date().toISOString()
    };
  }

  // 获取采集状态
  getCollectionStatus() {
    return {
      isCollecting: this.isCollecting,
      listenerCount: this.listeners.size,
      currentTemperature: this.getCurrentTemperature()
    };
  }

  // 设置温度范围
  setTemperatureRange(min, max) {
    this.minTemp = min;
    this.maxTemp = max;
    console.log(`温度范围设置: ${min}°C - ${max}°C`);
  }

  // 重置温度到默认值
  resetTemperature() {
    this.currentTemperature = 20.0;
    console.log('温度已重置到默认值: 20°C');
  }
}

// 创建单例实例
const temperatureService = new TemperatureService();

module.exports = temperatureService;