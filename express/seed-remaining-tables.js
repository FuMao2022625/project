const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: '12305',
  database: 'intelligent_inspection_system',
  waitForConnections: true,
  connectionLimit: 5,
  queueLimit: 0,
  charset: 'utf8mb4'
});

async function seedInspectionPoint() {
  console.log('正在为 inspection_point 表添加数据...');
  const points = [];
  for (let i = 1; i <= 200; i++) {
    points.push([
      `点位${i}`,
      Math.floor(Math.random() * 200) + 1,
      1,
      (Math.random() * 100).toFixed(6),
      (Math.random() * 100).toFixed(6),
      (Math.random() * 10).toFixed(6),
      null,
      null,
      0,
      1,
      new Date(),
      new Date()
    ]);
  }
  
  await pool.query(
    `INSERT INTO inspection_point (point_name, dept_id, point_type, coordinate_x, coordinate_y, coordinate_z, inspection_items, threshold_config, sort_num, status, create_time, update_time) VALUES ?`,
    [points]
  );
  console.log('✓ inspection_point 表添加 200 条数据成功');
}

async function seedPlan() {
  console.log('正在为 inspection_plan 表添加数据...');
  const plans = [];
  for (let i = 1; i <= 200; i++) {
    const startTime = new Date();
    startTime.setDate(startTime.getDate() + 1);
    startTime.setHours(9, 0, 0, 0);
    
    const endTime = new Date(startTime);
    endTime.setHours(18, 0, 0, 0);
    
    plans.push([
      `计划${i}`,
      Math.floor(Math.random() * 200) + 1,
      Math.floor(Math.random() * 200) + 1,
      1,
      '0 9 * * *',
      startTime,
      endTime,
      2,
      1,
      new Date(),
      Math.floor(Math.random() * 200) + 1
    ]);
  }
  
  await pool.query(
    `INSERT INTO inspection_plan (plan_name, route_id, bind_robot_id, cycle_type, cycle_config, plan_start_time, plan_end_time, task_priority, status, create_time, create_user_id) VALUES ?`,
    [plans]
  );
  console.log('✓ inspection_plan 表添加 200 条数据成功');
}

async function seedTask() {
  console.log('正在为 inspection_task 表添加数据...');
  const tasks = [];
  for (let i = 1; i <= 200; i++) {
    const expectStart = new Date();
    expectStart.setHours(expectStart.getHours() - Math.floor(Math.random() * 24));
    const actualStart = new Date(expectStart);
    actualStart.setMinutes(actualStart.getMinutes() + 5);
    const actualEnd = new Date(actualStart);
    actualEnd.setHours(actualEnd.getHours() + 2);
    
    const totalPoints = Math.floor(Math.random() * 10) + 5;
    const completedPoints = Math.floor(Math.random() * (totalPoints - 2)) + 2;
    
    tasks.push([
      `任务${i}`,
      Math.floor(Math.random() * 200) + 1,
      Math.floor(Math.random() * 200) + 1,
      Math.floor(Math.random() * 200) + 1,
      1,
      2,
      expectStart,
      actualStart,
      actualEnd,
      totalPoints,
      completedPoints,
      3,
      null,
      new Date(),
      Math.floor(Math.random() * 200) + 1
    ]);
  }
  
  await pool.query(
    `INSERT INTO inspection_task (task_name, plan_id, route_id, robot_id, task_type, task_priority, expect_start_time, actual_start_time, actual_end_time, total_points, completed_points, task_status, abnormal_reason, create_time, create_user_id) VALUES ?`,
    [tasks]
  );
  console.log('✓ inspection_task 表添加 200 条数据成功');
}

async function seedTaskPointExecution() {
  console.log('正在为 task_point_execution 表添加数据...');
  const executions = [];
  const used = new Set();
  
  for (let i = 1; i <= 200; i++) {
    let taskId, pointId;
    do {
      taskId = Math.floor(Math.random() * 200) + 1;
      pointId = Math.floor(Math.random() * 200) + 1;
    } while (used.has(`${taskId}-${pointId}`));
    
    used.add(`${taskId}-${pointId}`);
    
    const arriveTime = new Date();
    arriveTime.setHours(arriveTime.getHours() - Math.floor(Math.random() * 48));
    const leaveTime = new Date(arriveTime);
    leaveTime.setMinutes(leaveTime.getMinutes() + 5);
    
    executions.push([
      taskId,
      pointId,
      Math.floor(Math.random() * 200) + 1,
      arriveTime,
      leaveTime,
      1,
      1,
      null,
      new Date()
    ]);
  }
  
  await pool.query(
    `INSERT INTO task_point_execution (task_id, point_id, robot_id, arrive_time, leave_time, exec_status, inspection_result, abnormal_desc, create_time) VALUES ?`,
    [executions]
  );
  console.log('✓ task_point_execution 表添加 200 条数据成功');
}

async function seedSensorData() {
  console.log('正在为 sensor_data 表添加数据...');
  const data = [];
  for (let i = 1; i <= 200; i++) {
    const collectTime = new Date();
    collectTime.setMinutes(collectTime.getMinutes() - Math.floor(Math.random() * 1000));
    
    data.push([
      Math.floor(Math.random() * 200) + 1,
      Math.floor(Math.random() * 200) + 1,
      collectTime,
      (Math.random() * 100).toFixed(2),
      'normal',
      new Date()
    ]);
  }
  
  await pool.query(
    `INSERT INTO sensor_data (point_id, robot_id, collect_time, data_value, data_status, create_time) VALUES ?`,
    [data]
  );
  console.log('✓ sensor_data 表添加 200 条数据成功');
}

async function seedSensorRawMessage() {
  console.log('正在为 sensor_raw_message 表添加数据...');
  const messages = [];
  for (let i = 1; i <= 200; i++) {
    const collectTime = new Date();
    collectTime.setMinutes(collectTime.getMinutes() - Math.floor(Math.random() * 1000));
    
    messages.push([
      Math.floor(Math.random() * 200) + 1,
      Math.floor(Math.random() * 200) + 1,
      collectTime,
      Buffer.from(`原始数据消息${i}`),
      1,
      new Date()
    ]);
  }
  
  await pool.query(
    `INSERT INTO sensor_raw_message (point_id, robot_id, collect_time, raw_message, message_status, create_time) VALUES ?`,
    [messages]
  );
  console.log('✓ sensor_raw_message 表添加 200 条数据成功');
}

async function seedAlarmEvent() {
  console.log('正在为 alarm_event 表添加数据...');
  const alarms = [];
  for (let i = 1; i <= 200; i++) {
    const alarmTime = new Date();
    alarmTime.setMinutes(alarmTime.getMinutes() - Math.floor(Math.random() * 500));
    
    alarms.push([
      Math.floor(Math.random() * 200) + 1,
      Math.floor(Math.random() * 200) + 1,
      Math.floor(Math.random() * 200) + 1,
      `告警${i}`,
      Math.floor(Math.random() * 3) + 1,
      1,
      alarmTime,
      null,
      null,
      new Date()
    ]);
  }
  
  await pool.query(
    `INSERT INTO alarm_event (point_id, robot_id, task_id, alarm_name, alarm_level, alarm_status, alarm_time, confirm_time, handle_time, create_time) VALUES ?`,
    [alarms]
  );
  console.log('✓ alarm_event 表添加 200 条数据成功');
}

async function main() {
  try {
    console.log('开始为剩余表添加数据...\n');
    
    await seedInspectionPoint();
    await seedPlan();
    await seedTask();
    await seedTaskPointExecution();
    await seedSensorData();
    await seedSensorRawMessage();
    await seedAlarmEvent();
    
    console.log('\n✅ 所有表数据添加完成！');
    
  } catch (error) {
    console.error('❌ 添加数据失败:', error);
  } finally {
    await pool.end();
  }
}

main();
