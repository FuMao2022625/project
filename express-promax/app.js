/**
 * Express应用主文件
 * 功能：初始化Express应用，配置中间件，注册路由，处理错误
 * 作者：系统生成
 * 创建日期：2024-01-01
 * 主要修改记录：
 * 2024-01-01 - 初始化文件
 * 2026-03-07 - 添加Socket路由支持
 */

// 导入依赖模块
var createError = require('http-errors'); // HTTP错误处理
var express = require('express'); // Express框架
var path = require('path'); // 路径处理
var cookieParser = require('cookie-parser'); // Cookie解析
var logger = require('morgan'); // 日志记录
var cors = require('cors'); // 跨域支持

// 导入路由模块
var authRouter = require('./routes/auth'); // 认证路由
var temperatureRouter = require('./routes/temperature'); // 温度数据路由
var thermalRouter = require('./routes/thermal'); // 热成像数据路由
var exportRouter = require('./routes/export'); // 数据导出路由
var videoRouter = require('./routes/video'); // 视频流路由

// 导入数据库初始化函数
var { initializeDatabase } = require('./db');

// 创建Express应用实例
var app = express();

// 视图引擎设置
app.set('views', path.join(__dirname, 'views')); // 设置视图目录
app.set('view engine', 'pug'); // 设置视图引擎为Pug

// 中间件配置
app.use(logger('dev')); // 开发环境日志
app.use(express.json()); // 解析JSON请求体
app.use(express.urlencoded({ extended: false })); // 解析URL编码的请求体
app.use(cookieParser()); // 解析Cookie
app.use(express.static(path.join(__dirname, 'public'))); // 静态文件服务
app.use(cors()); // 启用跨域请求

// 注册路由
app.use('/auth', authRouter); // 认证相关路由
app.use('/temperature', temperatureRouter); // 温度数据路由
app.use('/thermal', thermalRouter); // 热成像数据路由
app.use('/export', exportRouter); // 数据导出路由
app.use('/video', videoRouter); // 视频流路由

// 初始化数据库连接
initializeDatabase()
  .then(() => {
    console.log('数据库初始化完成');
    
    // 捕获404错误并转发到错误处理器
    app.use(function(req, res, next) {
      next(createError(404));
    });
    
    // 错误处理器
    app.use(function(err, req, res, next) {
      // 设置本地变量，仅在开发环境中提供错误信息
      res.locals.message = err.message;
      res.locals.error = req.app.get('env') === 'development' ? err : {};

      // 检查是否为API请求（Accept: application/json）
      if (req.headers.accept && req.headers.accept.includes('application/json')) {
        // 返回JSON格式错误响应
        return res.status(err.status || 500).json({
          success: false,
          error: err.message || '服务器内部错误',
          stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
        });
      }

      // 渲染错误页面
      res.status(err.status || 500);
      res.render('error');
    });
  })
  .catch(err => {
    console.error('初始化数据库失败:', err);
    process.exit(1); // 数据库初始化失败，退出进程
  });

// 导出应用实例
module.exports = app;
