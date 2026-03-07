const { pool, initializeDatabase } = require('./db');
const bcrypt = require('bcrypt');

// 生成随机字符串
function generateRandomString(length) {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return result;
}

// 生成随机邮箱
function generateRandomEmail(index) {
  const domains = ['example.com', 'test.com', 'mail.com', 'email.com'];
  const domain = domains[Math.floor(Math.random() * domains.length)];
  return `user${index}@${domain}`;
}

// 生成随机日期
function generateRandomDate() {
  const now = new Date();
  const past = new Date(now.getTime() - Math.random() * 365 * 24 * 60 * 60 * 1000);
  return past;
}

// 生成随机状态
function generateRandomStatus(type) {
  if (type === 'user') {
    const statuses = ['active', 'pending_deletion', 'deleted'];
    return statuses[Math.floor(Math.random() * statuses.length)];
  } else if (type === 'robot') {
    const statuses = ['online', 'offline', 'maintenance'];
    return statuses[Math.floor(Math.random() * statuses.length)];
  }
  return 'active';
}

// 生成随机温度数据
function generateTemperatureData() {
  const data = [];
  for (let i = 0; i < 10; i++) {
    data.push({
      x: i,
      y: i,
      temperature: (20 + Math.random() * 20).toFixed(2)
    });
  }
  return JSON.stringify(data);
}

// 生成用户测试数据
async function generateUsersData() {
  const connection = await pool.getConnection();
  try {
    console.log('开始生成用户测试数据...');
    
    // 清空现有数据
    await connection.query('DELETE FROM users');
    
    // 生成200条用户数据
    const users = [];
    for (let i = 1; i <= 200; i++) {
      const username = `user${i}`;
      const email = generateRandomEmail(i);
      const password = await bcrypt.hash('password123', 10);
      const status = generateRandomStatus('user');
      const deactivatedAt = status !== 'active' ? generateRandomDate() : null;
      const deactivationReason = status !== 'active' ? `Reason ${i}` : null;
      
      users.push([username, email, password, status, deactivatedAt, deactivationReason]);
    }
    
    // 批量插入
    await connection.query(
      'INSERT INTO users (username, email, password, status, deactivated_at, deactivation_reason) VALUES ?',
      [users]
    );
    
    console.log('用户测试数据生成完成');
  } catch (error) {
    console.error('生成用户数据时出错:', error);
  } finally {
    connection.release();
  }
}

// 生成机器人测试数据
async function generateRobotsData() {
  const connection = await pool.getConnection();
  try {
    console.log('开始生成机器人测试数据...');
    
    // 清空现有数据
    await connection.query('DELETE FROM robots');
    
    // 生成200条机器人数据
    const robots = [];
    for (let i = 1; i <= 200; i++) {
      const robotId = `ROBOT-${generateRandomString(8)}`;
      const model = `Model-${Math.floor(Math.random() * 10) + 1}`;
      const status = generateRandomStatus('robot');
      
      robots.push([robotId, model, status]);
    }
    
    // 批量插入
    await connection.query(
      'INSERT INTO robots (robot_id, model, status) VALUES ?',
      [robots]
    );
    
    console.log('机器人测试数据生成完成');
  } catch (error) {
    console.error('生成机器人数据时出错:', error);
  } finally {
    connection.release();
  }
}

// 生成环境测试数据
async function generateEnvironmentsData() {
  const connection = await pool.getConnection();
  try {
    console.log('开始生成环境测试数据...');
    
    // 清空现有数据
    await connection.query('DELETE FROM environments');
    
    // 生成200条环境数据
    const environments = [];
    for (let i = 1; i <= 200; i++) {
      const envId = `ENV-${generateRandomString(8)}`;
      const location = `Location-${Math.floor(Math.random() * 50) + 1}`;
      const temperature = (10 + Math.random() * 30).toFixed(2);
      const humidity = (30 + Math.random() * 50).toFixed(2);
      const pressure = (900 + Math.random() * 200).toFixed(2);
      const monitoredAt = generateRandomDate();
      
      environments.push([envId, location, temperature, humidity, pressure, monitoredAt]);
    }
    
    // 批量插入
    await connection.query(
      'INSERT INTO environments (env_id, location, temperature, humidity, pressure, monitored_at) VALUES ?',
      [environments]
    );
    
    console.log('环境测试数据生成完成');
  } catch (error) {
    console.error('生成环境数据时出错:', error);
  } finally {
    connection.release();
  }
}

// 生成热成像测试数据
async function generateThermalImagesData() {
  const connection = await pool.getConnection();
  try {
    console.log('开始生成热成像测试数据...');
    
    // 清空现有数据
    await connection.query('DELETE FROM thermal_images');
    
    // 获取所有机器人ID
    const [robots] = await connection.query('SELECT robot_id FROM robots');
    const robotIds = robots.map(robot => robot.robot_id);
    
    if (robotIds.length === 0) {
      console.error('没有机器人数据，无法生成热成像数据');
      return;
    }
    
    // 生成200条热成像数据
    const thermalImages = [];
    for (let i = 1; i <= 200; i++) {
      const imageId = `IMG-${generateRandomString(8)}`;
      const robotId = robotIds[Math.floor(Math.random() * robotIds.length)];
      const capturedAt = generateRandomDate();
      const temperatureData = generateTemperatureData();
      const imagePath = `/images/thermal-${i}.jpg`;
      
      thermalImages.push([imageId, robotId, capturedAt, temperatureData, imagePath]);
    }
    
    // 批量插入
    await connection.query(
      'INSERT INTO thermal_images (image_id, robot_id, captured_at, temperature_data, image_path) VALUES ?',
      [thermalImages]
    );
    
    console.log('热成像测试数据生成完成');
  } catch (error) {
    console.error('生成热成像数据时出错:', error);
  } finally {
    connection.release();
  }
}

// 验证数据
async function verifyData() {
  const connection = await pool.getConnection();
  try {
    console.log('开始验证数据...');
    
    const tables = ['users', 'robots', 'environments', 'thermal_images'];
    for (const table of tables) {
      const [result] = await connection.query(`SELECT COUNT(*) as count FROM ${table}`);
      console.log(`${table}表记录数: ${result[0].count}`);
    }
    
    console.log('数据验证完成');
  } catch (error) {
    console.error('验证数据时出错:', error);
  } finally {
    connection.release();
  }
}

// 主函数
async function main() {
  try {
    // 初始化数据库
    await initializeDatabase();
    
    // 生成测试数据
    await generateUsersData();
    await generateRobotsData();
    await generateEnvironmentsData();
    await generateThermalImagesData();
    
    // 验证数据
    await verifyData();
    
    console.log('所有测试数据生成完成');
  } catch (error) {
    console.error('生成测试数据时出错:', error);
  } finally {
    // 关闭连接池
    await pool.end();
  }
}

// 运行主函数
main();
