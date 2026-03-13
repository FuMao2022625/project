const express = require('express');
const router = express.Router();
const QwenModel = require('../qwen-model');
const config = require('../config');

// 初始化Qwen模型实例
const qwenModel = new QwenModel(
  config.qwen.apiKey,
  config.qwen.modelName,
  config.qwen.baseURL
);

// 健康检查接口
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Qwen model service is healthy',
    timestamp: new Date().toISOString(),
    metrics: qwenModel.getMetrics()
  });
});

// 模型调用接口
router.post('/chat', async (req, res) => {
  try {
    const { prompt, options } = req.body;

    if (!prompt) {
      return res.status(400).json({
        success: false,
        message: 'Prompt is required'
      });
    }

    const response = await qwenModel.sendRequest(prompt, { ...config.qwen.defaultOptions, ...options });
    res.json(response);
  } catch (error) {
    console.error('Qwen model call error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to call Qwen model',
      error: error.message || error
    });
  }
});

// 获取性能指标接口
router.get('/metrics', (req, res) => {
  res.json({
    success: true,
    metrics: qwenModel.getMetrics(),
    timestamp: new Date().toISOString()
  });
});

// 重置性能指标接口
router.post('/metrics/reset', (req, res) => {
  qwenModel.resetMetrics();
  res.json({
    success: true,
    message: 'Metrics reset successfully',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;