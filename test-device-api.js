const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/device';

// 测试数据
const testDeviceData = {
  device_id: 'dev-001',
  device_name: '测试设备1',
  device_type: 'temperature',
  location: '办公室',
  status: 'active'
};

// 测试存储设备数据
async function testStoreDevice() {
  console.log('=== 测试存储设备数据 ===');
  try {
    const response = await axios.post(`${API_BASE_URL}/store`, testDeviceData);
    console.log('存储成功:', response.data);
    return response.data;
  } catch (error) {
    console.error('存储失败:', error.response?.data || error.message);
    return null;
  }
}

// 测试获取所有设备数据
async function testGetAllDevices() {
  console.log('\n=== 测试获取所有设备数据 ===');
  try {
    const response = await axios.get(`${API_BASE_URL}/all`);
    console.log('获取成功:', response.data);
    return response.data;
  } catch (error) {
    console.error('获取失败:', error.response?.data || error.message);
    return null;
  }
}

// 测试根据ID获取设备数据
async function testGetDeviceById(deviceId) {
  console.log(`\n=== 测试根据ID获取设备数据 (${deviceId}) ===`);
  try {
    const response = await axios.get(`${API_BASE_URL}/${deviceId}`);
    console.log('获取成功:', response.data);
    return response.data;
  } catch (error) {
    console.error('获取失败:', error.response?.data || error.message);
    return null;
  }
}

// 测试更新设备数据
async function testUpdateDevice() {
  console.log('\n=== 测试更新设备数据 ===');
  try {
    const updatedData = {
      ...testDeviceData,
      device_name: '更新后的测试设备1',
      location: '会议室'
    };
    const response = await axios.post(`${API_BASE_URL}/store`, updatedData);
    console.log('更新成功:', response.data);
    return response.data;
  } catch (error) {
    console.error('更新失败:', error.response?.data || error.message);
    return null;
  }
}

// 测试删除设备数据
async function testDeleteDevice(deviceId) {
  console.log(`\n=== 测试删除设备数据 (${deviceId}) ===`);
  try {
    const response = await axios.delete(`${API_BASE_URL}/${deviceId}`);
    console.log('删除成功:', response.data);
    return response.data;
  } catch (error) {
    console.error('删除失败:', error.response?.data || error.message);
    return null;
  }
}

// 测试边界条件 - 缺少必填字段
async function testMissingFields() {
  console.log('\n=== 测试边界条件 - 缺少必填字段 ===');
  try {
    const incompleteData = {
      device_id: 'dev-002'
      // 缺少 device_name 和 device_type
    };
    const response = await axios.post(`${API_BASE_URL}/store`, incompleteData);
    console.log('响应:', response.data);
  } catch (error) {
    console.error('预期的错误:', error.response?.data || error.message);
  }
}

// 运行所有测试
async function runAllTests() {
  console.log('开始测试设备API...\n');
  
  // 启动服务器
  const { exec } = require('child_process');
  const server = exec('npm start');
  
  // 等待服务器启动
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  try {
    // 测试存储设备数据
    const storedDevice = await testStoreDevice();
    
    // 测试获取所有设备数据
    await testGetAllDevices();
    
    // 测试根据ID获取设备数据
    if (storedDevice && storedDevice.data && storedDevice.data.device_id) {
      await testGetDeviceById(storedDevice.data.device_id);
    }
    
    // 测试更新设备数据
    await testUpdateDevice();
    
    // 测试边界条件
    await testMissingFields();
    
    // 测试删除设备数据
    if (storedDevice && storedDevice.data && storedDevice.data.device_id) {
      await testDeleteDevice(storedDevice.data.device_id);
    }
    
    console.log('\n所有测试完成!');
  } catch (error) {
    console.error('测试过程中发生错误:', error);
  } finally {
    // 停止服务器
    server.kill();
  }
}

// 运行测试
runAllTests();