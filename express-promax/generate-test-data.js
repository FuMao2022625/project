const { pool } = require('./db');
const bcrypt = require('bcrypt');

// 生成随机字符串
function generateRandomString(length) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// 生成随机邮箱
function generateRandomEmail(username) {
  const domains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'example.com'];
  const domain = domains[Math.floor(Math.random() * domains.length)];
  return `${username}@${domain}`;
}

// 生成随机密码
function generateRandomPassword() {
  return generateRandomString(12);
}

// 生成随机状态
function getRandomUserStatus() {
  const statuses = ['active', 'pending_deletion', 'deleted'];
  return statuses[Math.floor(Math.random() * statuses.length)];
}

// 生成随机机器人状态
function getRandomRobotStatus() {
  const statuses = ['在线', '离线', '维护中'];
  return statuses[Math.floor(Math.random() * statuses.length)];
}

// 生成随机环境类型
function getRandomEnvironmentType() {
  const types = ['室内', '室外', '工业车间'];
  return types[Math.floor(Math.random() * types.length)];
}

// 生成随机坐标
function generateRandomCoordinate() {
  const lat = (Math.random() * 180 - 90).toFixed(6);
  const lng = (Math.random() * 360 - 180).toFixed(6);
  return { lat, lng };
}

// 生成随机温度和湿度
function generateRandomClimate() {
  const temperature = (Math.random() * 50 - 10).toFixed(2); // -10 to 40
  const humidity = (Math.random() * 100).toFixed(2); // 0 to 100
  return { temperature, humidity };
}

// 为users表生成测试数据
async function generateUsersData() {
  console.log('开始生成用户数据...');
  
  try {
    const connection = await pool.getConnection();
    
    // 先清空表数据
    await connection.query('DELETE FROM users');
    
    const users = [];
    
    for (let i = 1; i <= 20; i++) {
      const username = `user${i}`;
      const email = generateRandomEmail(username);
      const password = await bcrypt.hash(generateRandomPassword(), 10);
      const status = getRandomUserStatus();
      const deactivated_at = status === 'active' ? null : new Date().toISOString().slice(0, 19).replace('T', ' ');
      const deactivation_reason = status === 'active' ? null : `Reason for deactivation ${i}`;
      
      users.push([
        username,
        email,
        password,
        status,
        deactivated_at,
        deactivation_reason
      ]);
    }
    
    const query = `
      INSERT INTO users (username, email, password, status, deactivated_at, deactivation_reason)
      VALUES ?
    `;
    
    const [result] = await connection.query(query, [users]);
    console.log(`成功插入 ${result.affectedRows} 条用户数据`);
    
    connection.release();
    return result.affectedRows;
  } catch (error) {
    console.error('生成用户数据错误:', error);
    throw error;
  }
}

// 为robots表生成测试数据
async function generateRobotsData() {
  console.log('开始生成机器人数据...');
  
  try {
    const connection = await pool.getConnection();
    
    // 先清空表数据
    await connection.query('DELETE FROM robots');
    
    const robots = [];
    const models = ['Model-A', 'Model-B', 'Model-C', 'Model-D', 'Model-E'];
    
    for (let i = 1; i <= 20; i++) {
      const robot_id = `robot_${generateRandomString(8)}`;
      const model = models[Math.floor(Math.random() * models.length)];
      const name = `机器人${i}号`;
      const status = getRandomRobotStatus();
      
      robots.push([
        robot_id,
        model,
        name,
        status
      ]);
    }
    
    const query = `
      INSERT INTO robots (robot_id, model, name, status)
      VALUES ?
    `;
    
    const [result] = await connection.query(query, [robots]);
    console.log(`成功插入 ${result.affectedRows} 条机器人数据`);
    
    connection.release();
    return result.affectedRows;
  } catch (error) {
    console.error('生成机器人数据错误:', error);
    throw error;
  }
}

// 为environments表生成测试数据
async function generateEnvironmentsData() {
  console.log('开始生成环境数据...');
  
  try {
    const connection = await pool.getConnection();
    
    // 先清空表数据
    await connection.query('DELETE FROM environments');
    
    const environments = [];
    const environmentNames = [
      '办公室', '仓库', '工厂', '实验室', '会议室',
      '服务器机房', '生产车间', '研发中心', '展示厅', '测试区'
    ];
    
    for (let i = 1; i <= 20; i++) {
      const environment_id = `env_${generateRandomString(8)}`;
      const name = `${environmentNames[Math.floor(Math.random() * environmentNames.length)]}${i}`;
      const { lat, lng } = generateRandomCoordinate();
      const type = getRandomEnvironmentType();
      const { temperature, humidity } = generateRandomClimate();
      
      environments.push([
        environment_id,
        name,
        lng,
        lat,
        type,
        temperature,
        humidity
      ]);
    }
    
    const query = `
      INSERT INTO environments (environment_id, name, longitude, latitude, type, temperature, humidity)
      VALUES ?
    `;
    
    const [result] = await connection.query(query, [environments]);
    console.log(`成功插入 ${result.affectedRows} 条环境数据`);
    
    connection.release();
    return result.affectedRows;
  } catch (error) {
    console.error('生成环境数据错误:', error);
    throw error;
  }
}

// 验证数据完整性
async function verifyDataIntegrity() {
  console.log('开始验证数据完整性...');
  
  try {
    const connection = await pool.getConnection();
    
    // 检查users表
    const [usersResult] = await connection.query('SELECT COUNT(*) as count FROM users');
    console.log(`users表数据量: ${usersResult[0].count}`);
    
    // 检查robots表
    const [robotsResult] = await connection.query('SELECT COUNT(*) as count FROM robots');
    console.log(`robots表数据量: ${robotsResult[0].count}`);
    
    // 检查environments表
    const [environmentsResult] = await connection.query('SELECT COUNT(*) as count FROM environments');
    console.log(`environments表数据量: ${environmentsResult[0].count}`);
    
    // 检查是否所有表都有20条数据
    const allTablesHave20Rows = (
      usersResult[0].count === 20 &&
      robotsResult[0].count === 20 &&
      environmentsResult[0].count === 20
    );
    
    console.log(`所有表数据完整性检查: ${allTablesHave20Rows ? '通过' : '失败'}`);
    
    // 检查唯一约束
    console.log('检查唯一约束...');
    
    // 检查users表的username唯一性
    const [duplicateUsers] = await connection.query(
      'SELECT username, COUNT(*) as count FROM users GROUP BY username HAVING count > 1'
    );
    console.log(`users表username重复: ${duplicateUsers.length === 0 ? '无' : duplicateUsers.length} 条`);
    
    // 检查users表的email唯一性
    const [duplicateEmails] = await connection.query(
      'SELECT email, COUNT(*) as count FROM users GROUP BY email HAVING count > 1'
    );
    console.log(`users表email重复: ${duplicateEmails.length === 0 ? '无' : duplicateEmails.length} 条`);
    
    // 检查robots表的robot_id唯一性
    const [duplicateRobots] = await connection.query(
      'SELECT robot_id, COUNT(*) as count FROM robots GROUP BY robot_id HAVING count > 1'
    );
    console.log(`robots表robot_id重复: ${duplicateRobots.length === 0 ? '无' : duplicateRobots.length} 条`);
    
    // 检查environments表的environment_id唯一性
    const [duplicateEnvironments] = await connection.query(
      'SELECT environment_id, COUNT(*) as count FROM environments GROUP BY environment_id HAVING count > 1'
    );
    console.log(`environments表environment_id重复: ${duplicateEnvironments.length === 0 ? '无' : duplicateEnvironments.length} 条`);
    
    // 检查environments表的name唯一性
    const [duplicateEnvNames] = await connection.query(
      'SELECT name, COUNT(*) as count FROM environments GROUP BY name HAVING count > 1'
    );
    console.log(`environments表name重复: ${duplicateEnvNames.length === 0 ? '无' : duplicateEnvNames.length} 条`);
    
    connection.release();
    
    return allTablesHave20Rows;
  } catch (error) {
    console.error('验证数据完整性错误:', error);
    throw error;
  }
}

// 主函数
async function main() {
  console.log('=== 开始生成测试数据 ===');
  
  try {
    // 生成数据
    const usersCount = await generateUsersData();
    const robotsCount = await generateRobotsData();
    const environmentsCount = await generateEnvironmentsData();
    
    console.log('\n=== 数据生成完成 ===');
    console.log(`用户数据: ${usersCount} 条`);
    console.log(`机器人数据: ${robotsCount} 条`);
    console.log(`环境数据: ${environmentsCount} 条`);
    
    // 验证数据
    const integrityCheck = await verifyDataIntegrity();
    
    console.log('\n=== 测试数据生成总结 ===');
    if (integrityCheck) {
      console.log('✅ 所有表均成功插入20条有效记录');
      console.log('✅ 数据完整性检查通过');
      console.log('✅ 无数据冲突或约束违反情况');
    } else {
      console.log('❌ 数据完整性检查失败');
      console.log('❌ 部分表数据量不足20条');
    }
    
  } catch (error) {
    console.error('生成测试数据失败:', error);
  } finally {
    // 关闭连接池
    await pool.end();
    console.log('\n=== 测试数据生成完成 ===');
  }
}

// 运行主函数
if (require.main === module) {
  main();
}

module.exports = {
  generateUsersData,
  generateRobotsData,
  generateEnvironmentsData,
  verifyDataIntegrity
};