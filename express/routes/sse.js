const express = require('express');
const router = express.Router();
const sseController = require('../controllers/sse.controller');

/**
 * @route GET /api/sse/temperature/stream
 * @desc 建立温度数据 SSE 实时推送连接
 * @access Public
 * @query {number} robot_id - 机器人 ID（可选）
 * @query {number} task_id - 任务 ID（可选）
 * @query {number} interval - 数据推送间隔（毫秒），默认 1000ms，范围 100-60000
 * @query {number} precision - 温度数据精度（小数位数），默认 2，范围 0-5
 * @query {boolean} include_humidity - 是否包含湿度数据，默认 true
 * @query {boolean} include_alerts - 是否包含告警信息，默认 false
 * @returns {SSE Stream} 实时温度数据流
 * 
 * @example
 * // 连接到 SSE 流
 * const eventSource = new EventSource('http://localhost:3000/api/sse/temperature/stream?interval=1000');
 * 
 * eventSource.onmessage = (event) => {
 *   const data = JSON.parse(event.data);
 *   console.log('收到数据:', data);
 * };
 */
router.get('/temperature/stream', async (req, res) => {
  await sseController.connectTemperatureStream(req, res);
});

/**
 * @route GET /api/sse/temperature/history
 * @desc 获取温度历史数据
 * @access Public
 * @query {number} robot_id - 机器人 ID（可选）
 * @query {number} task_id - 任务 ID（可选）
 * @query {string} startTime - 开始时间（ISO 格式）
 * @query {string} endTime - 结束时间（ISO 格式）
 * @query {number} limit - 返回记录数限制，默认 100，最大 1000
 * @query {number} precision - 温度数据精度，默认 2
 * @returns {object} 温度历史数据列表
 */
router.get('/temperature/history', async (req, res) => {
  await sseController.getTemperatureHistory(req, res);
});

/**
 * @route GET /api/sse/temperature/stats
 * @desc 获取温度统计数据
 * @access Public
 * @query {number} robot_id - 机器人 ID（可选）
 * @query {string} startTime - 开始时间（ISO 格式）
 * @query {string} endTime - 结束时间（ISO 格式）
 * @returns {object} 温度统计数据（平均值、最小值、最大值等）
 */
router.get('/temperature/stats', async (req, res) => {
  await sseController.getTemperatureStats(req, res);
});

/**
 * @route GET /api/sse/temperature/alerts
 * @desc 获取温度告警数据
 * @access Public
 * @query {number} robot_id - 机器人 ID（可选）
 * @query {number} temp_threshold - 温度阈值，默认 50
 * @query {number} limit - 返回记录数限制，默认 50
 * @returns {object} 温度告警列表
 */
router.get('/temperature/alerts', async (req, res) => {
  await sseController.getTemperatureAlerts(req, res);
});

/**
 * @route GET /api/sse/connections
 * @desc 获取当前 SSE 连接状态
 * @access Public
 * @returns {object} 连接状态信息
 */
router.get('/connections', (req, res) => {
  sseController.getConnectionStatus(req, res);
});

/**
 * @route DELETE /api/sse/connections/:clientId
 * @desc 断开指定 SSE 连接
 * @access Public
 * @param {string} clientId - 客户端 ID
 * @returns {object} 操作结果
 */
router.delete('/connections/:clientId', (req, res) => {
  sseController.disconnectClient(req, res);
});

module.exports = router;
