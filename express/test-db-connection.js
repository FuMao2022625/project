const { testConnection } = require('./config/database');

async function runTest() {
  console.log('===========================================');
  console.log('MySQL 数据库连接测试');
  console.log('===========================================\n');
  
  const success = await testConnection();
  
  console.log('\n===========================================');
  if (success) {
    console.log('测试结果：成功 ✓');
  } else {
    console.log('测试结果：失败 ✗');
  }
  console.log('===========================================');
  
  process.exit(success ? 0 : 1);
}

runTest();
