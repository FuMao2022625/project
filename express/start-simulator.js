const simulator = require('./services/temperature.simulator');

console.log('🚀 启动温度数据模拟器...\n');

const interval = parseInt(process.argv[2]) || 2000;

simulator.start(interval);

process.on('SIGINT', () => {
  console.log('\n📊 正在停止模拟器...');
  simulator.stop();
  
  const status = simulator.getStatus();
  console.log('\n最终状态:');
  console.log(JSON.stringify(status, null, 2));
  
  process.exit(0);
});

console.log('\n按 Ctrl+C 停止模拟器\n');
