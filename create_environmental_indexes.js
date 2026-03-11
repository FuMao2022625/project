var mysql = require('mysql');

var connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '12305',
  database: 'express'
});

connection.connect(function(err) {
  if (err) {
    console.error('数据库连接失败: ' + err.stack);
    return;
  }
  console.log('数据库连接成功，连接ID: ' + connection.threadId);
  
  // 创建剩余索引
  var createRecordedAtIndexSQL = 'CREATE INDEX idx_recorded_at ON environmental_monitoring(recorded_at);';
  connection.query(createRecordedAtIndexSQL, function(err, result) {
    if (err) {
      console.error('创建recorded_at索引失败: ' + err.message);
    } else {
      console.log('recorded_at索引创建成功');
    }
  });
  
  var createStatusIndexSQL = 'CREATE INDEX idx_status ON environmental_monitoring(status);';
  connection.query(createStatusIndexSQL, function(err, result) {
    if (err) {
      console.error('创建status索引失败: ' + err.message);
    } else {
      console.log('status索引创建成功');
    }
    connection.end();
  });
});
