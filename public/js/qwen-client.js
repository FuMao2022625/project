class QwenClient {
  constructor(apiUrl = '/qwen/chat') {
    this.apiUrl = apiUrl;
    this.requestId = 0;
  }

  // 生成唯一请求ID
  generateRequestId() {
    return `req_${++this.requestId}_${Date.now()}`;
  }

  // 构建请求参数
  buildRequestParams(prompt, options = {}) {
    return {
      prompt: prompt,
      options: options
    };
  }

  // 发送请求到Qwen API
  async sendRequest(prompt, options = {}) {
    const requestId = this.generateRequestId();
    const startTime = Date.now();
    const params = this.buildRequestParams(prompt, options);

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(params)
      });

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      return {
        success: data.success,
        content: data.content,
        usage: data.usage,
        model: data.model,
        id: data.id,
        responseTime: responseTime,
        requestId: requestId
      };
    } catch (error) {
      console.error('Qwen API request failed:', error);
      return {
        success: false,
        error: error.message,
        requestId: requestId
      };
    }
  }

  // 健康检查
  async healthCheck() {
    try {
      const response = await fetch('/qwen/health');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Health check failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // 获取性能指标
  async getMetrics() {
    try {
      const response = await fetch('/qwen/metrics');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Get metrics failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// 导出QwenClient类
if (typeof module !== 'undefined' && module.exports) {
  module.exports = QwenClient;
} else if (typeof window !== 'undefined') {
  window.QwenClient = QwenClient;
}