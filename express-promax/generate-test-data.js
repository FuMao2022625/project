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
  const statuses = ['online', 'offline', 'maintenance'];
  return statuses[Math.floor(Math.random() * statuses.length)];
}

// 生成随机环境类型
function getRandomEnvironmentType() {
  const types = ['indoor', 'outdoor', 'warehouse', 'factory', 'laboratory'];
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

// 插入环境测试数据
async function insertEnvironmentData() {
  try {
    const connection = await pool.getConnection();
    
    for (let i = 1; i <= 20; i++) {
      const environmentId = `ENV_${i.toString().padStart(3, '0')}`;
      const name = `Environment ${i}`;
      const location = `Location ${i}, Building ${Math.floor(Math.random() * 10) + 1}`;
      const type = getRandomEnvironmentType();
      const temperature = getRandomTemperature();
      const humidity = getRandomHumidity();
      
      await connection.query(
        'INSERT INTO environments (environment_id, name, location, type, temperature, humidity) VALUES (?, ?, ?, ?, ?, ?)',
        [environmentId, name, location, type, temperature, humidity]
      );
    }
    
    connection.release();
    console.log('环境测试数据插入完成');
  } catch (error) {
    console.error('插入环境数据错误:', error);
    throw error;
  }
}

// 插入成像测试数据
async function insertImageData() {
  try {
    const connection = await pool.getConnection();
    
    // 获取所有机器人ID
    const [robots] = await connection.query('SELECT robot_id FROM robots');
    const robotIds = robots.map(robot => robot.robot_id);
    
    for (let i = 1; i <= 20; i++) {
      const imageId = `IMG_${i.toString().padStart(3, '0')}`;
      const robotId = robotIds[Math.floor(Math.random() * robotIds.length)];
      const captureTime = getRandomDate();
      const path = `/images/${imageId}.${getRandomImageFormat()}`;
      const format = getRandomImageFormat();
      const resolution = getRandomResolution();
      
      await connection.query(
        'INSERT INTO images (image_id, robot_id, capture_time, path, format, resolution) VALUES (?, ?, ?, ?, ?, ?)',
        [imageId, robotId, captureTime, path, format, resolution]
      );
    }
    
    connection.release();
    console.log('成像测试数据插入完成');
  } catch (error) {
    console.error('插入成像数据错误:', error);
    throw error;
  }
}

// 验证数据插入结果
async function verifyData() {
  try {
    const connection = await pool.getConnection();
    
    const [robotsCount] = await connection.query('SELECT COUNT(*) as count FROM robots');
    const [environmentsCount] = await connection.query('SELECT COUNT(*) as count FROM environments');
    const [imagesCount] = await connection.query('SELECT COUNT(*) as count FROM images');
    
    console.log(`机器人表记录数: ${robotsCount[0].count}`);
    console.log(`环境表记录数: ${environmentsCount[0].count}`);
    console.log(`成像表记录数: ${imagesCount[0].count}`);
    
    connection.release();
  } catch (error) {
    console.error('验证数据错误:', error);
    throw error;
  }
}

// 主函数
async function main() {
  try {
    console.log('开始插入测试数据...');
    await insertRobotData();
    await insertEnvironmentData();
    await insertImageData();
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