var express = require('express');
var router = express.Router();
const { pool } = require('../db');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// 支持的表列表
const SUPPORTED_TABLES = ['users', 'robots', 'environments', 'thermal_images'];

// 生成唯一文件名
function generateFileName(table, format) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  return `${table}_${timestamp}.${format}`;
}

// 导出为CSV格式
async function exportToCSV(table, filters = {}) {
  try {
    // 构建查询语句
    let query = `SELECT * FROM ${table}`;
    let params = [];
    
    if (Object.keys(filters).length > 0) {
      query += ' WHERE';
      const conditions = [];
      
      if (filters.startDate) {
        conditions.push('created_at >= ?');
        params.push(filters.startDate);
      }
      
      if (filters.endDate) {
        conditions.push('created_at <= ?');
        params.push(filters.endDate);
      }
      
      if (filters.status) {
        conditions.push('status = ?');
        params.push(filters.status);
      }
      
      query += ' ' + conditions.join(' AND');
    }
    
    // 执行查询
    const [rows] = await pool.query(query, params);
    
    if (rows.length === 0) {
      throw new Error('没有找到数据');
    }
    
    // 生成CSV文件
    const fileName = generateFileName(table, 'csv');
    const filePath = path.join(__dirname, '../public/exports', fileName);
    
    // 确保导出目录存在
    if (!fs.existsSync(path.join(__dirname, '../public/exports'))) {
      fs.mkdirSync(path.join(__dirname, '../public/exports'), { recursive: true });
    }
    
    // 准备CSV写入器
    const headers = Object.keys(rows[0]).map(key => ({
      id: key,
      title: key
    }));
    
    const csvWriter = createCsvWriter({
      path: filePath,
      header: headers
    });
    
    // 写入数据
    await csvWriter.writeRecords(rows);
    
    return {
      fileName,
      filePath,
      recordCount: rows.length
    };
  } catch (error) {
    console.error('导出CSV失败:', error);
    throw error;
  }
}

// 导出为Excel格式
async function exportToExcel(table, filters = {}) {
  try {
    // 构建查询语句
    let query = `SELECT * FROM ${table}`;
    let params = [];
    
    if (Object.keys(filters).length > 0) {
      query += ' WHERE';
      const conditions = [];
      
      if (filters.startDate) {
        conditions.push('created_at >= ?');
        params.push(filters.startDate);
      }
      
      if (filters.endDate) {
        conditions.push('created_at <= ?');
        params.push(filters.endDate);
      }
      
      if (filters.status) {
        conditions.push('status = ?');
        params.push(filters.status);
      }
      
      query += ' ' + conditions.join(' AND');
    }
    
    // 执行查询
    const [rows] = await pool.query(query, params);
    
    if (rows.length === 0) {
      throw new Error('没有找到数据');
    }
    
    // 生成Excel文件
    const fileName = generateFileName(table, 'xlsx');
    const filePath = path.join(__dirname, '../public/exports', fileName);
    
    // 确保导出目录存在
    if (!fs.existsSync(path.join(__dirname, '../public/exports'))) {
      fs.mkdirSync(path.join(__dirname, '../public/exports'), { recursive: true });
    }
    
    // 创建工作簿和工作表
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(rows);
    
    // 添加工作表到工作簿
    XLSX.utils.book_append_sheet(workbook, worksheet, table);
    
    // 写入文件
    XLSX.writeFile(workbook, filePath);
    
    return {
      fileName,
      filePath,
      recordCount: rows.length
    };
  } catch (error) {
    console.error('导出Excel失败:', error);
    throw error;
  }
}

// 导出API路由
router.post('/data', async function(req, res, next) {
  try {
    const { table, format, filters } = req.body;
    
    // 验证参数
    if (!table || !SUPPORTED_TABLES.includes(table)) {
      return res.status(400).json({
        success: false,
        error: '无效的表名'
      });
    }
    
    if (!format || !['csv', 'xlsx'].includes(format)) {
      return res.status(400).json({
        success: false,
        error: '无效的格式'
      });
    }
    
    // 执行导出
    let result;
    if (format === 'csv') {
      result = await exportToCSV(table, filters);
    } else {
      result = await exportToExcel(table, filters);
    }
    
    // 返回导出结果
    res.json({
      success: true,
      data: {
        fileName: result.fileName,
        recordCount: result.recordCount,
        downloadUrl: `/exports/${result.fileName}`
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || '导出失败'
    });
  }
});

// 获取支持的表列表
router.get('/tables', function(req, res, next) {
  res.json({
    success: true,
    data: SUPPORTED_TABLES
  });
});

module.exports = router;