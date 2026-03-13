const db = require('./db');

// 先删除device表（如果存在），然后重新创建
function recreateDeviceTable() {
  const dropTableQuery = 'DROP TABLE IF EXISTS device';
  
  db.query(dropTableQuery, function(error, results) {
    if (error) {
      console.error('删除device表失败:', error);
      return;
    }
    
    console.log('device表已删除（如果存在）');
    
    // 创建新的device表
    const createTableQuery = `
      CREATE TABLE device (
        id INT AUTO_INCREMENT PRIMARY KEY,
        device_id VARCHAR(255) NOT NULL UNIQUE,
        device_name VARCHAR(255) NOT NULL,
        device_type VARCHAR(255) NOT NULL,
        location VARCHAR(255),
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
    `;
    
    db.query(createTableQuery, function(error, results) {
      if (error) {
        console.error('创建device表失败:', error);
        return;
      }
      console.log('device表创建成功');
      
      // 关闭数据库连接
      db.end();
    });
  });
}

// 执行重建表操作
recreateDeviceTable();