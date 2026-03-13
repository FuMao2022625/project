const axios = require('axios');
const fs = require('fs');
const path = require('path');

class QwenModel {
  constructor(apiKey, modelName = 'qwen-turbo', baseURL = 'https://ark.cn-beijing.volces.com/api/v3') {
    this.apiKey = apiKey;
    this.modelName = modelName;
    this.baseURL = baseURL;
    this.logger = new Logger();
    this.metrics = new Metrics();
  }

  // 生成唯一请求ID
  generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // 构建请求参数
  buildRequestParams(prompt, options = {}) {
    return {
      model: this.modelName,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: options.temperature || 0.7,
      max_tokens: options.maxTokens || 1024,
      top_p: options.topP || 0.95,
      stream: options.stream || false,
      ...options
    };
  }

  // 发送请求到Qwen API
  async sendRequest(prompt, options = {}) {
    const requestId = this.generateRequestId();
    const startTime = Date.now();
    const params = this.buildRequestParams(prompt, options);

    this.logger.info(`[${requestId}] 发送请求到Qwen模型: ${prompt.substring(0, 50)}...`);

    try {
      const response = await axios({
        method: 'post',
        url: `${this.baseURL}/chat/completions`,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        data: params
      });

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      this.metrics.recordRequest(responseTime);
      this.logger.info(`[${requestId}] 请求成功，响应时间: ${responseTime}ms`);

      return this.processResponse(response.data);
    } catch (error) {
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      this.metrics.recordError();
      this.logger.error(`[${requestId}] 请求失败，响应时间: ${responseTime}ms`, error);

      throw this.handleError(error);
    }
  }

  // 处理API响应
  processResponse(data) {
    if (data.choices && data.choices.length > 0) {
      return {
        success: true,
        content: data.choices[0].message.content,
        usage: data.usage,
        model: data.model,
        id: data.id
      };
    }
    return {
      success: false,
      error: 'Invalid response format',
      data: data
    };
  }

  // 处理错误
  handleError(error) {
    if (error.response) {
      // 服务器返回错误状态码
      return {
        success: false,
        error: `API Error: ${error.response.status} ${error.response.statusText}`,
        details: error.response.data
      };
    } else if (error.request) {
      // 请求已发送但没有收到响应
      return {
        success: false,
        error: 'Network Error: No response received',
        details: error.request
      };
    } else {
      // 请求配置出错
      return {
        success: false,
        error: `Request Error: ${error.message}`,
        details: error
      };
    }
  }

  // 获取性能指标
  getMetrics() {
    return this.metrics.getMetrics();
  }

  // 重置性能指标
  resetMetrics() {
    this.metrics.reset();
  }
}

// 日志记录类
class Logger {
  constructor(logDir = './logs') {
    this.logDir = logDir;
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
  }

  getLogFilePath() {
    const date = new Date().toISOString().split('T')[0];
    return path.join(this.logDir, `qwen-model_${date}.log`);
  }

  log(level, message, error = null) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}${error ? `\nError: ${error.stack || error.message}` : ''}\n`;
    
    console[level === 'error' ? 'error' : 'log'](logMessage);
    
    try {
      fs.appendFileSync(this.getLogFilePath(), logMessage);
    } catch (err) {
      console.error('Failed to write log:', err);
    }
  }

  info(message) {
    this.log('info', message);
  }

  error(message, error) {
    this.log('error', message, error);
  }

  warn(message) {
    this.log('warn', message);
  }
}

// 性能监控类
class Metrics {
  constructor() {
    this.reset();
  }

  recordRequest(responseTime) {
    this.totalRequests++;
    this.totalResponseTime += responseTime;
    this.responseTimes.push(responseTime);
  }

  recordError() {
    this.totalErrors++;
  }

  getMetrics() {
    const avgResponseTime = this.totalRequests > 0 ? this.totalResponseTime / this.totalRequests : 0;
    const errorRate = this.totalRequests > 0 ? (this.totalErrors / this.totalRequests) * 100 : 0;

    return {
      totalRequests: this.totalRequests,
      totalErrors: this.totalErrors,
      avgResponseTime: avgResponseTime.toFixed(2),
      errorRate: errorRate.toFixed(2),
      responseTimes: this.responseTimes
    };
  }

  reset() {
    this.totalRequests = 0;
    this.totalErrors = 0;
    this.totalResponseTime = 0;
    this.responseTimes = [];
  }
}

// 导出QwenModel类
module.exports = QwenModel;