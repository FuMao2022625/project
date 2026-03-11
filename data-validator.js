const { log, VALID_FIRE_RISKS, VALID_ENV_STATUSES } = require('./data-processor');

function parseAndValidateData(rawData, processingId) {
  let parsedData;
  
  try {
    parsedData = JSON.parse(rawData);
  } catch (error) {
    throw new Error(`JSON解析失败: ${error.message}`);
  }
  
  const validatedData = {
    sensor_type: validateString(parsedData.type, 'sensor_type', 50),
    temperature: validateNumber(parsedData.temperature, 'temperature', -50, 150),
    humidity: validateNumber(parsedData.humidity, 'humidity', 0, 100),
    smoke_level: validateNumber(parsedData.smoke_level, 'smoke_level', 0, 1),
    max_temp: validateTemperatureMatrix(parsedData.max_temp),
    human_detected: validateBoolean(parsedData.human_detected, 'human_detected'),
    fire_risk: validateEnum(parsedData.fire_risk, 'fire_risk', VALID_FIRE_RISKS),
    env_status: validateEnum(parsedData.env_status, 'env_status', VALID_ENV_STATUSES),
    battery: validateNumber(parsedData.battery, 'battery', 0, 100),
    recorded_at: new Date()
  };
  
  log('INFO', `数据验证通过 [ID: ${processingId}]`);
  return validatedData;
}

function validateString(value, fieldName, maxLength) {
  if (value === undefined || value === null) {
    throw new Error(`字段 ${fieldName} 不能为空`);
  }
  
  const strValue = String(value);
  if (strValue.length > maxLength) {
    throw new Error(`字段 ${fieldName} 长度超过限制 (${maxLength})`);
  }
  
  return strValue;
}

function validateNumber(value, fieldName, min, max) {
  if (value === undefined || value === null) {
    throw new Error(`字段 ${fieldName} 不能为空`);
  }
  
  const numValue = Number(value);
  
  if (isNaN(numValue)) {
    throw new Error(`字段 ${fieldName} 不是有效的数字: ${value}`);
  }
  
  if (numValue < min || numValue > max) {
    throw new Error(`字段 ${fieldName} 超出范围 [${min}, ${max}]: ${numValue}`);
  }
  
  return numValue;
}

function validateBoolean(value, fieldName) {
  if (value === undefined || value === null) {
    throw new Error(`字段 ${fieldName} 不能为空`);
  }
  
  if (typeof value === 'boolean') {
    return value;
  }
  
  if (value === 'true' || value === 1 || value === '1') {
    return true;
  }
  
  if (value === 'false' || value === 0 || value === '0') {
    return false;
  }
  
  throw new Error(`字段 ${fieldName} 不是有效的布尔值: ${value}`);
}

function validateEnum(value, fieldName, validValues) {
  if (value === undefined || value === null) {
    throw new Error(`字段 ${fieldName} 不能为空`);
  }
  
  const upperValue = String(value).toUpperCase();
  
  if (!validValues.includes(upperValue)) {
    throw new Error(`字段 ${fieldName} 值无效: ${value}, 有效值: ${validValues.join(', ')}`);
  }
  
  return upperValue;
}

function validateTemperatureMatrix(matrix) {
  if (!Array.isArray(matrix)) {
    throw new Error('max_temp 必须是数组');
  }
  
  if (matrix.length !== 8) {
    throw new Error(`max_temp 必须是8x8矩阵，当前行数: ${matrix.length}`);
  }
  
  for (let i = 0; i < matrix.length; i++) {
    if (!Array.isArray(matrix[i])) {
      throw new Error(`max_temp 第${i}行不是数组`);
    }
    
    if (matrix[i].length !== 8) {
      throw new Error(`max_temp 第${i}行必须有8个元素，当前: ${matrix[i].length}`);
    }
    
    for (let j = 0; j < matrix[i].length; j++) {
      const temp = Number(matrix[i][j]);
      if (isNaN(temp)) {
        throw new Error(`max_temp [${i}][${j}] 不是有效数字: ${matrix[i][j]}`);
      }
      if (temp < -50 || temp > 150) {
        throw new Error(`max_temp [${i}][${j}] 温度超出范围: ${temp}`);
      }
    }
  }
  
  return JSON.stringify(matrix);
}

module.exports = {
  parseAndValidateData,
  validateString,
  validateNumber,
  validateBoolean,
  validateEnum,
  validateTemperatureMatrix
};
