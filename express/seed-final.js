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
      i,
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
  return points.map((_, i) => i + 1);
}

async function seedPlan(pointIds) {
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
  return plans.map((_, i) => i + 1);
}

async function seedTask(planIds) {
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
      planIds[Math.floor(Math.random() * planIds.length)],
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
  return tasks.map((_, i) => i + 1);
}

async function seedTaskPointExecution(taskIds, pointIds) {
  console.log('正在为 task_point_execution 表添加数据...');
  const executions = [];
  
  for (let i = 0; i < 200; i++) {
    const taskId = taskIds[i];
    const pointId = pointIds[(i * 7 + 13) % pointIds.length];
    
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
  return executions.map((_, i) => i + 1);
}

async function seedSensorData(execIds) {
  console.log('正在为 sensor_data 表添加数据...');
  const data = [];
  for (let i = 1; i <= 200; i++) {
    const dataTime = new Date();
    dataTime.setMinutes(dataTime.getMinutes() - Math.floor(Math.random() * 1000));
    
    data.push([
      2000 + i,
      Math.floor(Math.random() * 200) + 1,
      Math.floor(Math.random() * 200) + 1,
      execIds[Math.floor(Math.random() * execIds.length)],
      dataTime,
      (Math.random() * 30 + 20).toFixed(2),
      (Math.random() * 60 + 30).toFixed(2),
      (Math.random() * 10).toFixed(3),
      (Math.random() * 35 + 20).toFixed(2),
      0,
      0,
      0,
      Math.floor(Math.random() * 100)
    ]);
  }
  
  await pool.query(
    `INSERT INTO sensor_data (msg_id, robot_id, task_id, exec_id, data_time, temperature, humidity, smoke_level, max_temp, human_detected, fire_risk, env_status, battery) VALUES ?`,
    [data]
  );
  console.log('✓ sensor_data 表添加 200 条数据成功');
}

async function seedSensorRawMessage() {
  console.log('正在为 sensor_raw_message 表添加数据...');
  const messages = [];
  for (let i = 1; i <= 200; i++) {
    const receiveTime = new Date();
    receiveTime.setMinutes(receiveTime.getMinutes() - Math.floor(Math.random() * 1000));
    
    messages.push([
      `192.168.1.${Math.floor(Math.random() * 255)}`,
      Math.floor(Math.random() * 65535),
      `原始数据内容${i}`,
      receiveTime,
      1,
      Math.floor(Math.random() * 200) + 1,
      null
    ]);
  }
  
  await pool.query(
    `INSERT INTO sensor_raw_message (client_ip, client_port, raw_content, receive_time, parse_status, robot_id, error_msg) VALUES ?`,
    [messages]
  );
  console.log('✓ sensor_raw_message 表添加 200 条数据成功');
}

async function seedAlarmEvent(taskIds, execIds) {
  console.log('正在为 alarm_event 表添加数据...');
  const alarms = [];
  for (let i = 1; i <= 200; i++) {
    const triggerTime = new Date();
    triggerTime.setMinutes(triggerTime.getMinutes() - Math.floor(Math.random() * 500));
    
    alarms.push([
      `ALM${Date.now()}${i}`,
      Math.floor(Math.random() * 200) + 1,
      taskIds[Math.floor(Math.random() * taskIds.length)],
      execIds[Math.floor(Math.random() * execIds.length)],
      Math.floor(Math.random() * 200) + 1,
      Math.floor(Math.random() * 3) + 1,
      Math.floor(Math.random() * 3) + 1,
      `告警标题${i}`,
      `告警内容描述${i}`,
      triggerTime,
      1,
      null,
      null,
      null
    ]);
  }
  
  await pool.query(
    `INSERT INTO alarm_event (alarm_no, robot_id, task_id, exec_id, data_id, alarm_type, alarm_level, alarm_title, alarm_content, trigger_time, alarm_status, handle_user_id, handle_time, handle_result) VALUES ?`,
    [alarms]
  );
  console.log('✓ alarm_event 表添加 200 条数据成功');
}

async function main() {
  try {
    console.log('开始为剩余表添加数据...\n');
    
    const pointIds = await seedInspectionPoint();
    const planIds = await seedPlan(pointIds);
    const taskIds = await seedTask(planIds);
    const execIds = await seedTaskPointExecution(taskIds, pointIds);
    await seedSensorData(execIds);
    await seedSensorRawMessage();
    await seedAlarmEvent(taskIds, execIds);
    
    console.log('\n✅ 所有表数据添加完成！');
    
  } catch (error) {
    console.error('❌ 添加数据失败:', error);
  } finally {
    await pool.end();
  }
}

main();
