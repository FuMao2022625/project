const express = require('express');
const { pool } = require('../db');
const thermalStreamService = require('../services/thermalStreamService');
const router = express.Router();

// 获取热成像数据流状态
router.get('/stream/status', (req, res) => {
  try {
    const status = thermalStreamService.getStreamStatus();
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('获取流状态错误:', error);
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    });
  }
});

// 开始热成像数据流
router.post('/stream/start', async (req, res) => {
  try {
    const { robotId, environmentId } = req.body;
    
    thermalStreamService.startStreaming(robotId, environmentId);
    
    res.json({
      success: true,
      message: '热成像数据流已启动',
      data: {
        robotId: robotId,
        environmentId: environmentId
      }
    });
  } catch (error) {
    console.error('启动数据流错误:', error);
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    });
  }
});

// 停止热成像数据流
router.post('/stream/stop', (req, res) => {
  try {
    thermalStreamService.stopStreaming();
    
    res.json({
      success: true,
      message: '热成像数据流已停止'
    });
  } catch (error) {
    console.error('停止数据流错误:', error);
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    });
  }
});

// 添加机器人到数据流
router.post('/stream/robots/:robotId', async (req, res) => {
  try {
    const { robotId } = req.params;
    
    // 验证机器人是否存在
    const [robots] = await pool.query(
      'SELECT * FROM robots WHERE robot_id = ?',
      [robotId]
    );

    if (robots.length === 0) {
      return res.status(404).json({
        success: false,
        error: '机器人不存在'
      });
    }
    
    thermalStreamService.addRobotToStream(robotId);
    
    res.json({
      success: true,
      message: `机器人 ${robotId} 已添加到数据流`
    });
  } catch (error) {
    console.error('添加机器人到数据流错误:', error);
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    });
  }
});

// 从数据流中移除机器人
router.delete('/stream/robots/:robotId', (req, res) => {
  try {
    const { robotId } = req.params;
    
    thermalStreamService.removeRobotFromStream(robotId);
    
    res.json({
      success: true,
      message: `机器人 ${robotId} 已从数据流中移除`
    });
  } catch (error) {
    console.error('从数据流中移除机器人错误:', error);
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    });
  }
});

// 添加环境到数据流
router.post('/stream/environments/:environmentId', async (req, res) => {
  try {
    const { environmentId } = req.params;
    
    // 验证环境是否存在
    const [environments] = await pool.query(
      'SELECT * FROM environments WHERE environment_id = ?',
      [environmentId]
    );

    if (environments.length === 0) {
      return res.status(404).json({
        success: false,
        error: '环境不存在'
      });
    }
    
    thermalStreamService.addEnvironmentToStream(environmentId);
    
    res.json({
      success: true,
      message: `环境 ${environmentId} 已添加到数据流`
    });
  } catch (error) {
    console.error('添加环境到数据流错误:', error);
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    });
  }
});

// 从数据流中移除环境
router.delete('/stream/environments/:environmentId', (req, res) => {
  try {
    const { environmentId } = req.params;
    
    thermalStreamService.removeEnvironmentFromStream(environmentId);
    
    res.json({
      success: true,
      message: `环境 ${environmentId} 已从数据流中移除`
    });
  } catch (error) {
    console.error('从数据流中移除环境错误:', error);
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    });
  }
});

// 获取热成像数据格式规范
router.get('/data-format', (req, res) => {
  try {
    const dataFormat = thermalStreamService.constructor.getThermalDataFormat();
    
    res.json({
      success: true,
      data: {
        format: dataFormat,
        description: '热成像数据格式规范',
        version: '1.0.0'
      }
    });
  } catch (error) {
    console.error('获取数据格式错误:', error);
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    });
  }
});

// 生成单次热成像数据（用于测试）
router.get('/data/sample', (req, res) => {
  try {
    const { robotId, environmentId } = req.query;
    
    const thermalData = thermalStreamService.generateThermalData(robotId, environmentId);
    const compressedData = thermalStreamService.compressThermalData(thermalData);
    
    res.json({
      success: true,
      data: {
        original: thermalData,
        compressed: compressedData,
        compressionRatio: thermalData.compression.ratio
      }
    });
  } catch (error) {
    console.error('生成样本数据错误:', error);
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    });
  }
});

module.exports = router;