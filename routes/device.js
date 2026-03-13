const express = require('express');
const router = express.Router();
const db = require('../db');

// 数据验证函数
function validateDeviceData(data) {
  const errors = [];
  
  // 检查必填字段
  if (!data.device_id) {
    errors.push('device_id is required');
  }
  if (!data.device_name) {
    errors.push('device_name is required');
  }
  if (!data.device_type) {
    errors.push('device_type is required');
  }
  
  // 检查数据类型
  if (data.device_id && typeof data.device_id !== 'string') {
    errors.push('device_id must be a string');
  }
  if (data.device_name && typeof data.device_name !== 'string') {
    errors.push('device_name must be a string');
  }
  if (data.device_type && typeof data.device_type !== 'string') {
    errors.push('device_type must be a string');
  }
  if (data.location && typeof data.location !== 'string') {
    errors.push('location must be a string');
  }
  if (data.status && typeof data.status !== 'string') {
    errors.push('status must be a string');
  }
  
  return errors;
}

// 存储设备数据接口
router.post('/store', async (req, res) => {
  try {
    const deviceData = req.body;
    
    // 验证数据
    const validationErrors = validateDeviceData(deviceData);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }
    
    // 构建插入语句
    const insertQuery = `
      INSERT INTO device (device_id, device_name, device_type, location, status)
      VALUES (?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        device_name = VALUES(device_name),
        device_type = VALUES(device_type),
        location = VALUES(location),
        status = VALUES(status),
        updated_at = CURRENT_TIMESTAMP
    `;
    
    const values = [
      deviceData.device_id,
      deviceData.device_name,
      deviceData.device_type,
      deviceData.location || null,
      deviceData.status || 'active'
    ];
    
    // 执行插入操作
    db.query(insertQuery, values, function(error, results) {
      if (error) {
        console.error('存储设备数据失败:', error);
        return res.status(500).json({
          success: false,
          message: 'Failed to store device data',
          error: error.message
        });
      }
      
      res.json({
        success: true,
        message: 'Device data stored successfully',
        data: {
          id: results.insertId || deviceData.device_id,
          ...deviceData
        }
      });
    });
  } catch (error) {
    console.error('处理设备数据失败:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process device data',
      error: error.message
    });
  }
});

// 获取所有设备数据接口
router.get('/all', (req, res) => {
  try {
    const query = 'SELECT * FROM device ORDER BY created_at DESC';
    
    db.query(query, function(error, results) {
      if (error) {
        console.error('获取设备数据失败:', error);
        return res.status(500).json({
          success: false,
          message: 'Failed to get device data',
          error: error.message
        });
      }
      
      res.json({
        success: true,
        message: 'Device data retrieved successfully',
        data: results
      });
    });
  } catch (error) {
    console.error('处理设备数据请求失败:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process device data request',
      error: error.message
    });
  }
});

// 根据ID获取设备数据接口
router.get('/:deviceId', (req, res) => {
  try {
    const deviceId = req.params.deviceId;
    const query = 'SELECT * FROM device WHERE device_id = ?';
    
    db.query(query, [deviceId], function(error, results) {
      if (error) {
        console.error('获取设备数据失败:', error);
        return res.status(500).json({
          success: false,
          message: 'Failed to get device data',
          error: error.message
        });
      }
      
      if (results.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Device not found'
        });
      }
      
      res.json({
        success: true,
        message: 'Device data retrieved successfully',
        data: results[0]
      });
    });
  } catch (error) {
    console.error('处理设备数据请求失败:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process device data request',
      error: error.message
    });
  }
});

// 删除设备数据接口
router.delete('/:deviceId', (req, res) => {
  try {
    const deviceId = req.params.deviceId;
    const query = 'DELETE FROM device WHERE device_id = ?';
    
    db.query(query, [deviceId], function(error, results) {
      if (error) {
        console.error('删除设备数据失败:', error);
        return res.status(500).json({
          success: false,
          message: 'Failed to delete device data',
          error: error.message
        });
      }
      
      if (results.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: 'Device not found'
        });
      }
      
      res.json({
        success: true,
        message: 'Device data deleted successfully'
      });
    });
  } catch (error) {
    console.error('处理设备数据删除请求失败:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process device data deletion request',
      error: error.message
    });
  }
});

module.exports = router;