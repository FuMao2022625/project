const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const app = express();
const port = 3000;
const routes = require('./routes');
const authRoutes = require('./routes/auth');
const db = require('./config/db');

app.use(helmet());

// 配置CORS中间件
const corsOptions = {
  origin: '*', // 允许所有域访问，生产环境中应设置为具体的域名
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  maxAge: 86400, // 预检请求缓存时间，单位为秒
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/', routes);
app.use('/api/auth', authRoutes);

app.use((req, res, next) => {
  res.status(404).send('Not Found');
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  // 处理CORS相关错误
  if (err.name === 'CORSError') {
    res.status(403).json({
      error: 'CORS Error',
      message: 'Cross-origin request was rejected',
      details: err.message
    });
  } else {
    res.status(500).send('Internal Server Error');
  }
});

if (require.main === module) {
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  }).on('error', (err) => {
    console.error(`Server startup error: ${err.message}`);
    process.exit(1);
  });
}

module.exports = app;