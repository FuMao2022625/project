const { pool } = require('./db');

// 生成随机字符串
function generateRandomString(length) {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

// 生成随机状态
function getRandomStatus() {
  const statuses = ['在线', '离线', '维护中'];
  return statuses[Math.floor(Math.random() * statuses.length)];
}

// 生成随机环境类型
function getRandomEnvironmentType() {
  const types = ['室内', '室外', '工业车间'];
  return types[Math.floor(Math.random() * types.length)];
}

// 生成随机温度
function getRandomTemperature() {
  return (Math.random() * 50 - 10).toFixed(2); // -10 to 40 degrees
}

// 生成随机湿度
function getRandomHumidity() {
  return (Math.random() * 100).toFixed(2); // 0 to 100%
}

// 生成随机图像格式
function getRandomImageFormat() {
  const formats = ['jpg', 'png', 'bmp', 'gif'];
  return formats[Math.floor(Math.random() * formats.length)];
}

// 生成随机分辨率
function getRandomResolution() {
  const resolutions = ['1280x720', '1920x1080', '2560x1440', '3840x2160'];
  return resolutions[Math.floor(Math.random() * resolutions.length)];
}

// 生成随机日期
function getRandomDate() {
  const now = new Date();
  const past = new Date(now.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000); // 过去30天内
  return past.toISOString().slice(0, 19).replace('T', ' ');
}

// 插入机器人测试数据
async function insertRobotData() {
  try {
    const connection = await pool.getConnection();
    
    for (let i = 1; i <= 20; i++) {
      const robotId = `ROBOT_${i.toString().padStart(3, '0')}`;
      const model = `Model-${generateRandomString(5)}`;
      const name = `Robot ${i}`;
      const status = getRandomStatus();
      
      await connection.query(
        'INSERT INTO robots (robot_id, model, name, status) VALUES (?, ?, ?, ?)',
        [robotId, model, name, status]
      );
    }
    
    connection.release();
    console.log('机器人测试数据插入完成');
  } catch (error) {
    console.error('插入机器人数据错误:', error);
    throw error;
  }
}

// 生成随机经度
function getRandomLongitude() {
  return (Math.random() * 360 - 180).toFixed(6); // -180 to 180
}

// 生成随机纬度
function getRandomLatitude() {
  return (Math.random() * 180 - 90).toFixed(6); // -90 to 90
}

// 插入环境测试数据
async function insertEnvironmentData() {
  try {
    const connection = await pool.getConnection();
    
    for (let i = 1; i <= 20; i++) {
      const environmentId = `ENV_${i.toString().padStart(3, '0')}`;
      const name = `Environment ${i}`;
      const longitude = getRandomLongitude();
      const latitude = getRandomLatitude();
      const type = getRandomEnvironmentType();
      const temperature = getRandomTemperature();
      const humidity = getRandomHumidity();
      
      await connection.query(
        'INSERT INTO environments (environment_id, name, longitude, latitude, type, temperature, humidity) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [environmentId, name, longitude, latitude, type, temperature, humidity]
      );
    }
    
    connection.release();
    console.log('环境测试数据插入完成');
  } catch (error) {
    console.error('插入环境数据错误:', error);
    throw error;
  }
}

// 生成随机宽度
function getRandomWidth() {
  return Math.floor(Math.random() * 2048) + 640; // 640-2688
}

// 生成随机高度
function getRandomHeight() {
  return Math.floor(Math.random() * 1536) + 480; // 480-2016
}

// 生成随机温度范围
function getRandomTemperatureRange() {
  const min = (Math.random() * 20 + 10).toFixed(2); // 10-30
  const max = (parseFloat(min) + Math.random() * 20).toFixed(2); // min-50
  return { min, max };
}

// 生成随机成像状态
function getRandomImageStatus() {
  const statuses = ['正常', '异常', '处理中'];
  return statuses[Math.floor(Math.random() * statuses.length)];
}

// 生成随机文件大小
function getRandomFileSize() {
  return Math.floor(Math.random() * 10000000) + 1000000; // 1MB-11MB
}

// 插入热成像测试数据
async function insertThermalImageData() {
  try {
    const connection = await pool.getConnection();
    
    // 获取所有机器人ID
    const [robots] = await connection.query('SELECT robot_id FROM robots');
    const robotIds = robots.map(robot => robot.robot_id);
    
    // 获取所有环境ID
    const [environments] = await connection.query('SELECT environment_id FROM environments');
    const environmentIds = environments.map(env => env.environment_id);
    
    for (let i = 1; i <= 20; i++) {
      const imageId = `THERMAL_${i.toString().padStart(3, '0')}`;
      const robotId = robotIds[Math.floor(Math.random() * robotIds.length)];
      const environmentId = environmentIds[Math.floor(Math.random() * environmentIds.length)];
      const captureTime = getRandomDate();
      const path = `/thermal_images/${imageId}.jpg`;
      const width = getRandomWidth();
      const height = getRandomHeight();
      const temperatureRange = getRandomTemperatureRange();
      const status = getRandomImageStatus();
      const fileSize = getRandomFileSize();
      
      await connection.query(
        'INSERT INTO thermal_images (image_id, robot_id, environment_id, capture_time, path, width, height, min_temperature, max_temperature, status, file_size) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [imageId, robotId, environmentId, captureTime, path, width, height, temperatureRange.min, temperatureRange.max, status, fileSize]
      );
    }
    
    connection.release();
    console.log('热成像测试数据插入完成');
  } catch (error) {
    console.error('插入热成像数据错误:', error);
    throw error;
  }
}

// 验证数据插入结果
async function verifyData() {
  try {
    const connection = await pool.getConnection();
    
    const [usersCount] = await connection.query('SELECT COUNT(*) as count FROM users');
    const [robotsCount] = await connection.query('SELECT COUNT(*) as count FROM robots');
    const [environmentsCount] = await connection.query('SELECT COUNT(*) as count FROM environments');
    const [thermalImagesCount] = await connection.query('SELECT COUNT(*) as count FROM thermal_images');
    
    console.log(`用户表记录数: ${usersCount[0].count}`);
    console.log(`机器人表记录数: ${robotsCount[0].count}`);
    console.log(`环境表记录数: ${environmentsCount[0].count}`);
    console.log(`热成像表记录数: ${thermalImagesCount[0].count}`);
    
    connection.release();
  } catch (error) {
    console.error('验证数据错误:', error);
    throw error;
  }
}

// 生成随机用户名
function generateUsername() {
  return `user${Math.floor(Math.random() * 10000)}`;
}

// 生成随机邮箱
function generateEmail() {
  return `user${Math.floor(Math.random() * 10000)}@example.com`;
}

// 生成随机密码
function generatePassword() {
  return `password${Math.floor(Math.random() * 10000)}`;
}

// 生成随机用户状态
function getRandomUserStatus() {
  const statuses = ['active', 'pending_deletion', 'deleted'];
  return statuses[Math.floor(Math.random() * statuses.length)];
}

// 插入用户测试数据
async function insertUserData() {
  try {
    const connection = await pool.getConnection();
    
    for (let i = 1; i <= 20; i++) {
      const username = generateUsername();
      const email = generateEmail();
      const password = generatePassword();
      const status = getRandomUserStatus();
      const deactivatedAt = status === 'active' ? null : getRandomDate();
      const deactivationReason = status === 'active' ? null : `Reason ${i}`;
      
      await connection.query(
        'INSERT INTO users (username, email, password, status, deactivated_at, deactivation_reason) VALUES (?, ?, ?, ?, ?, ?)',
        [username, email, password, status, deactivatedAt, deactivationReason]
      );
    }
    
    connection.release();
    console.log('用户测试数据插入完成');
  } catch (error) {
    console.error('插入用户数据错误:', error);
    throw error;
  }
}

// 清空所有表
async function clearTables() {
  try {
    const connection = await pool.getConnection();
    
    // 先清空热成像表（因为它引用了其他表）
    await connection.query('DELETE FROM thermal_images');
    // 再清空机器人表
    await connection.query('DELETE FROM robots');
    // 再清空环境表
    await connection.query('DELETE FROM environments');
    // 最后清空用户表
    await connection.query('DELETE FROM users');
    
    connection.release();
    console.log('所有表已清空');
  } catch (error) {
    console.error('清空表错误:', error);
    throw error;
  }
}

// 主函数
async function main() {
  try {
    console.log('开始插入测试数据...');
    await clearTables();
    await insertUserData();
    await insertRobotData();
    await insertEnvironmentData();
    await insertThermalImageData();
    console.log('测试数据插入完成，开始验证...');
    await verifyData();
    console.log('所有操作完成');
  } catch (error) {
    console.error('操作错误:', error);
  } finally {
    await pool.end();
  }
}

main();