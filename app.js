var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

require('./db');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var thermalSSERouter = require('./routes/thermal-sse');
var qwenRouter = require('./routes/qwen');
var deviceRouter = require('./routes/device');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/thermal-sse', thermalSSERouter);
app.use('/qwen', qwenRouter);
app.use('/device', deviceRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // 直接返回 JSON 响应，避免使用 pug 模板
  res.status(err.status || 500);
  res.json({
    success: false,
    message: err.message,
    error: req.app.get('env') === 'development' ? err : {},
    status: err.status || 500
  });
});


module.exports = app;
