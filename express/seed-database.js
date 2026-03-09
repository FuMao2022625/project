const { pool } = require('./config/database');

async function seedDepartment() {
  console.log('正在为 sys_department 表添加数据...');
  const departments = [];
  for (let i = 1; i <= 200; i++) {
    departments.push([
      `部门${i}`,
      i === 1 ? 0 : Math.floor(Math.random() * (i - 1)) + 1,
      Math.floor(Math.random() * 3) + 1,
      `位置描述${i}`,
      new Date(),
      new Date()
    ]);
  }
  
  await pool.query(
    `INSERT INTO sys_department (dept_name, parent_dept_id, dept_level, location_desc, create_time, update_time) 
     VALUES ?`,
    [departments]
  );
  console.log('✓ sys_department 表添加 200 条数据成功');
}

async function seedUser(departmentIds) {
  console.log('正在为 sys_user 表添加数据...');
  const users = [];
  for (let i = 1; i <= 200; i++) {
    const deptId = departmentIds[Math.floor(Math.random() * departmentIds.length)];
    users.push([
      `user${String(i).padStart(4, '0')}`,
      'e10adc3949ba59abbe56e057f20f883e',
      `用户${i}`,
      `138${String(i).padStart(8, '0')}`,
      deptId,
      1,
      new Date(),
      null
    ]);
  }
  
  await pool.query(
    `INSERT INTO sys_user (username, password, real_name, phone, dept_id, status, create_time, last_login_time) 
     VALUES ?`,
    [users]
  );
  console.log('✓ sys_user 表添加 200 条数据成功');
}

async function seedRobot(departmentIds) {
  console.log('正在为 inspection_robot 表添加数据...');
  const robots = [];
  for (let i = 1; i <= 200; i++) {
    const deptId = departmentIds[Math.floor(Math.random() * departmentIds.length)];
    robots.push([
      `SN-${String(i).padStart(8, '0')}`,
      `机器人${i}`,
      `Model-${i % 5 + 1}`,
      `192.168.1.${i % 256}`,
      8080 + i,
      deptId,
      new Date(),
      new Date(),
      new Date(),
      i % 3,
      Math.floor(50 + Math.random() * 50),
      `备注${i}`
    ]);
  }
  
  await pool.query(
    `INSERT INTO inspection_robot (robot_sn, robot_name, robot_model, fixed_ip, fixed_port, 
     dept_id, register_time, last_online_time, last_report_time, robot_status, current_battery, remark) 
     VALUES ?`,
    [robots]
  );
  console.log('✓ inspection_robot 表添加 200 条数据成功');
}

async function seedRoute(departmentIds, robotIds) {
  console.log('正在为 inspection_route 表添加数据...');
  const routes = [];
  for (let i = 1; i <= 200; i++) {
    const deptId = departmentIds[Math.floor(Math.random() * departmentIds.length)];
    const robotId = robotIds[Math.floor(Math.random() * robotIds.length)];
    const pointCount = Math.floor(Math.random() * 10) + 5;
    const pointIds = Array.from({length: pointCount}, (_, j) => j + 1).join(',');
    
    routes.push([
      `路线${i}`,
      deptId,
      pointIds,
      pointCount,
      Math.floor(Math.random() * 120) + 30,
      robotId,
      1,
      new Date(),
      1,
      new Date()
    ]);
  }
  
  await pool.query(
    `INSERT INTO inspection_route (route_name, dept_id, point_ids, total_points, estimated_time, 
     bind_robot_id, status, create_time, create_user_id, update_time) VALUES ?`,
    [routes]
  );
  console.log('✓ inspection_route 表添加 200 条数据成功');
}

async function seedPlan(robotIds, routeIds, userIds) {
  console.log('正在为 inspection_plan 表添加数据...');
  const plans = [];
  for (let i = 1; i <= 200; i++) {
    const robotId = robotIds[Math.floor(Math.random() * robotIds.length)];
    const routeId = routeIds[Math.floor(Math.random() * routeIds.length)];
    const userId = userIds[Math.floor(Math.random() * userIds.length)];
    
    const startTime = new Date();
    startTime.setDate(startTime.getDate() + 1);
    startTime.setHours(9, 0, 0, 0);
    
    const endTime = new Date(startTime);
    endTime.setHours(18, 0, 0, 0);
    
    plans.push([
      `计划${i}`,
      routeId,
      robotId,
      1,
      '0 9 * * *',
      '0 18 * * *',
      startTime,
      endTime,
      2,
      1,
      new Date(),
      userId
    ]);
  }
  
  await pool.query(
    `INSERT INTO inspection_plan (plan_name, route_id, bind_robot_id, cycle_type, 
     cycle_config, plan_start_time, plan_end_time, task_priority, status, create_time, create_user_id) VALUES ?`,
    [plans]
  );
  console.log('✓ inspection_plan 表添加 200 条数据成功');
}

async function seedTask(robotIds, planIds, routeIds, userIds) {
  console.log('正在为 inspection_task 表添加数据...');
  const tasks = [];
  for (let i = 1; i <= 200; i++) {
    const robotId = robotIds[Math.floor(Math.random() * robotIds.length)];
    const planId = planIds[Math.floor(Math.random() * planIds.length)];
    const routeId = routeIds[Math.floor(Math.random() * routeIds.length)];
    const userId = userIds[Math.floor(Math.random() * userIds.length)];
    
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
      planId,
      routeId,
      robotId,
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
      userId
    ]);
  }
  
  await pool.query(
    `INSERT INTO inspection_task (task_name, plan_id, route_id, robot_id, task_type, 
     task_priority, expect_start_time, actual_start_time, actual_end_time, total_points, 
     completed_points, task_status, abnormal_reason, create_time, create_user_id) VALUES ?`,
    [tasks]
  );
  console.log('✓ inspection_task 表添加 200 条数据成功');
}

async function seedPoint(departmentIds) {
  console.log('正在为 inspection_point 表添加数据...');
  const points = [];
  for (let i = 1; i <= 200; i++) {
    const deptId = departmentIds[Math.floor(Math.random() * departmentIds.length)];
    
    points.push([
      `巡检点${i}`,
      deptId,
      1,
      (Math.random() * 100).toFixed(6),
      (Math.random() * 100).toFixed(6),
      (Math.random() * 50).toFixed(6),
      '[{"type": "temperature", "threshold": 50}, {"type": "humidity", "threshold": 80}]',
      '{"temperature": {"min": 0, "max": 50}, "humidity": {"min": 20, "max": 80}}',
      i,
      1,
      new Date(),
      new Date()
    ]);
  }
  
  await pool.query(
    `INSERT INTO inspection_point (point_name, dept_id, point_type, coordinate_x, coordinate_y, 
     coordinate_z, inspection_items, threshold_config, sort_num, status, create_time, update_time) VALUES ?`,
    [points]
  );
  console.log('✓ inspection_point 表添加 200 条数据成功');
}

async function seedTaskPoint(taskIds, pointIds) {
  console.log('正在为 task_point_execution 表添加数据...');
  const executions = [];
  for (let i = 1; i <= 200; i++) {
    const taskId = taskIds[Math.floor(Math.random() * taskIds.length)];
    const pointId = pointIds[Math.floor(Math.random() * pointIds.length)];
    const arriveTime = new Date();
    arriveTime.setHours(arriveTime.getHours() - Math.floor(Math.random() * 48));
    const leaveTime = new Date(arriveTime);
    leaveTime.setMinutes(leaveTime.getMinutes() + 5);
    
    executions.push([
      taskId,
      pointId,
      3,
      arriveTime,
      leaveTime,
      new Date()
    ]);
  }
  
  await pool.query(
    `INSERT INTO task_point_execution (task_id, point_id, status, 
     arrive_time, leave_time, create_time) VALUES ?`,
    [executions]
  );
  console.log('✓ task_point_execution 表添加 200 条数据成功');
}

async function seedSensorData(robotIds, taskIds, execIds) {
  console.log('正在为 sensor_data 表添加数据...');
  const sensorData = [];
  for (let i = 1; i <= 200; i++) {
    const robotId = robotIds[Math.floor(Math.random() * robotIds.length)];
    const taskId = taskIds[Math.floor(Math.random() * taskIds.length)];
    const execId = execIds[Math.floor(Math.random() * execIds.length)];
    const dataTime = new Date();
    dataTime.setMinutes(dataTime.getMinutes() - Math.floor(Math.random() * 1440));
    
    const temperature = (20 + Math.random() * 30).toFixed(2);
    const humidity = (30 + Math.random() * 40).toFixed(2);
    const smokeLevel = (Math.random() * 5).toFixed(3);
    const maxTemp = (parseFloat(temperature) + Math.random() * 5).toFixed(2);
    const humanDetected = Math.random() > 0.7 ? 1 : 0;
    const fireRisk = Math.random() > 0.9 ? 1 : 0;
    const envStatus = Math.random() > 0.8 ? 1 : 0;
    const battery = Math.floor(50 + Math.random() * 50);
    
    sensorData.push([
      `MSG-${String(i).padStart(10, '0')}`,
      robotId,
      taskId,
      execId,
      dataTime,
      temperature,
      humidity,
      smokeLevel,
      maxTemp,
      humanDetected,
      fireRisk,
      envStatus,
      battery
    ]);
  }
  
  await pool.query(
    `INSERT INTO sensor_data (msg_id, robot_id, task_id, exec_id, data_time, 
     temperature, humidity, smoke_level, max_temp, human_detected, fire_risk, 
     env_status, battery) VALUES ?`,
    [sensorData]
  );
  console.log('✓ sensor_data 表添加 200 条数据成功');
}

async function seedSensorRawMessage(robotIds) {
  console.log('正在为 sensor_raw_message 表添加数据...');
  const rawMessages = [];
  for (let i = 1; i <= 200; i++) {
    const robotId = robotIds[Math.floor(Math.random() * robotIds.length)];
    const receiveTime = new Date();
    receiveTime.setMinutes(receiveTime.getMinutes() - Math.floor(Math.random() * 1440));
    
    rawMessages.push([
      `192.168.1.${i % 256}`,
      8080 + i,
      `{"robot_id": ${robotId}, "temperature": ${20 + Math.random() * 30}, "humidity": ${30 + Math.random() * 40}}`,
      receiveTime,
      1,
      robotId,
      null
    ]);
  }
  
  await pool.query(
    `INSERT INTO sensor_raw_message (client_ip, client_port, raw_content, 
     receive_time, parse_status, robot_id, error_msg) VALUES ?`,
    [rawMessages]
  );
  console.log('✓ sensor_raw_message 表添加 200 条数据成功');
}

async function seedAlarmEvent(robotIds, taskIds, execIds, dataIds, userIds) {
  console.log('正在为 alarm_event 表添加数据...');
  const alarms = [];
  for (let i = 1; i <= 200; i++) {
    const robotId = robotIds[Math.floor(Math.random() * robotIds.length)];
    const taskId = Math.random() > 0.3 ? taskIds[Math.floor(Math.random() * taskIds.length)] : null;
    const execId = Math.random() > 0.3 ? execIds[Math.floor(Math.random() * execIds.length)] : null;
    const dataId = Math.random() > 0.3 ? dataIds[Math.floor(Math.random() * dataIds.length)] : null;
    const triggerTime = new Date();
    triggerTime.setHours(triggerTime.getHours() - Math.floor(Math.random() * 72));
    
    const alarmTypes = [1, 2, 3, 4, 5];
    const alarmLevels = [1, 2, 3];
    const alarmStatuses = [0, 1, 2];
    
    const alarmType = alarmTypes[Math.floor(Math.random() * alarmTypes.length)];
    const alarmLevel = alarmLevels[Math.floor(Math.random() * alarmLevels.length)];
    const alarmStatus = alarmStatuses[Math.floor(Math.random() * alarmStatuses.length)];
    const handleUserId = alarmStatus !== 0 ? userIds[Math.floor(Math.random() * userIds.length)] : null;
    const handleTime = alarmStatus !== 0 ? new Date(triggerTime.getTime() + 3600000) : null;
    
    alarms.push([
      `ALARM-${String(i).padStart(6, '0')}`,
      robotId,
      taskId,
      execId,
      dataId,
      alarmType,
      alarmLevel,
      `报警标题${i}`,
      `报警内容描述${i}`,
      triggerTime,
      alarmStatus,
      handleUserId,
      handleTime,
      handleTime ? `处理结果${i}` : null,
      new Date()
    ]);
  }
  
  await pool.query(
    `INSERT INTO alarm_event (alarm_no, robot_id, task_id, exec_id, data_id, 
     alarm_type, alarm_level, alarm_title, alarm_content, trigger_time, 
     alarm_status, handle_user_id, handle_time, handle_result, create_time) VALUES ?`,
    [alarms]
  );
  console.log('✓ alarm_event 表添加 200 条数据成功');
}

async function seedAllTables() {
  const connection = await pool.getConnection();
  
  try {
    console.log('===========================================');
    console.log('开始为数据库表添加数据');
    console.log('===========================================\n');
    
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');
    
    await connection.query('DELETE FROM alarm_event');
    await connection.query('DELETE FROM sensor_raw_message');
    await connection.query('DELETE FROM sensor_data');
    await connection.query('DELETE FROM task_point_execution');
    await connection.query('DELETE FROM inspection_point');
    await connection.query('DELETE FROM inspection_task');
    await connection.query('DELETE FROM inspection_plan');
    await connection.query('DELETE FROM inspection_route');
    await connection.query('DELETE FROM inspection_robot');
    await connection.query('DELETE FROM sys_user');
    await connection.query('DELETE FROM sys_department');
    
    console.log('✓ 清空所有表数据完成\n');
    
    await seedDepartment();
    const [deptRows] = await connection.query('SELECT dept_id FROM sys_department');
    const departmentIds = deptRows.map(row => row.dept_id);
    
    await seedUser(departmentIds);
    const [userRows] = await connection.query('SELECT user_id FROM sys_user');
    const userIds = userRows.map(row => row.user_id);
    
    await seedRobot(departmentIds);
    const [robotRows] = await connection.query('SELECT robot_id FROM inspection_robot');
    const robotIds = robotRows.map(row => row.robot_id);
    
    await seedRoute(departmentIds, robotIds);
    const [routeRows] = await connection.query('SELECT route_id FROM inspection_route');
    const routeIds = routeRows.map(row => row.route_id);
    
    await seedPlan(robotIds, routeIds, userIds);
    const [planRows] = await connection.query('SELECT plan_id FROM inspection_plan');
    const planIds = planRows.map(row => row.plan_id);
    
    await seedTask(robotIds, planIds, routeIds, userIds);
    const [taskRows] = await connection.query('SELECT task_id FROM inspection_task');
    const taskIds = taskRows.map(row => row.task_id);
    
    await seedPoint(departmentIds);
    const [pointRows] = await connection.query('SELECT point_id FROM inspection_point');
    const pointIds = pointRows.map(row => row.point_id);
    
    await seedTaskPoint(taskIds, pointIds);
    const [execRows] = await connection.query('SELECT exec_id FROM task_point_execution');
    const execIds = execRows.map(row => row.exec_id);
    
    await seedSensorData(robotIds, taskIds, execIds);
    const [dataRows] = await connection.query('SELECT data_id FROM sensor_data');
    const dataIds = dataRows.map(row => row.data_id);
    
    await seedSensorRawMessage(robotIds);
    await seedAlarmEvent(robotIds, taskIds, execIds, dataIds, userIds);
    
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');
    
    console.log('\n===========================================');
    console.log('所有表数据添加完成！');
    console.log('===========================================');
    
    const [tableStats] = await connection.query(`
      SELECT table_name, table_rows 
      FROM information_schema.tables 
      WHERE table_schema = 'intelligent_inspection_system'
      ORDER BY table_name
    `);
    
    console.log('\n表数据统计:');
    tableStats.forEach(table => {
      console.log(`  ${table.table_name}: ${table.table_rows} 条`);
    });
    
  } catch (error) {
    console.error('添加数据失败:', error.message);
    throw error;
  } finally {
    connection.release();
  }
}

seedAllTables().catch(console.error);
