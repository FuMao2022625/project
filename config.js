// 配置文件，用于存储Qwen模型的API调用参数和认证信息
// 注意：实际使用时，应将API密钥存储在环境变量中，而不是直接硬编码

module.exports = {
  qwen: {
    
    // 注意：需要从阿里云获取有效的API密钥
    apiKey: process.env.QWEN_API_KEY || 'sk-208f40f9177c4a828eb3e4f64688146f',
    // 模型名称
    modelName: 'qwen-plus',
    // API基础URL
    baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    // 默认请求参数
    defaultOptions: {
      temperature: 0.7,
      maxTokens: 1024,
      topP: 0.95,
      stream: false
    }
  }
};