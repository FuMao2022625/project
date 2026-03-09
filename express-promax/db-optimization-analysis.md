# 数据库结构优化分析报告

## 1. 现状分析

### 1.1 现有表结构

| 表名 | 主要字段 | 索引 | 潜在问题 |
|------|---------|------|----------|
| users | id, username, email, password, status, created_at, updated_at | PRIMARY KEY (id), UNIQUE (username, email) | 无明显问题 |
| devices | id, device_id, name, type, status, created_at, updated_at | PRIMARY KEY (id), INDEX (device_id, status) | device_id作为外键被多个表引用，但使用VARCHAR类型 |
| robots | id, robot_id, model, status, created_at, updated_at | PRIMARY KEY (id), INDEX (robot_id, status) | 同上，robot_id使用VARCHAR类型 |
| environments | id, env_id, location, temperature, humidity, pressure, monitored_at | PRIMARY KEY (id), INDEX (env_id, location, monitored_at) | 无明显问题 |
| thermal_images | id, image_id, robot_id, captured_at, temperature_data, image_path | PRIMARY KEY (id), INDEX (image_id, robot_id, captured_at), FOREIGN KEY (robot_id) | temperature_data使用JSON类型，可能影响查询性能 |
| device_data | id, device_id, timestamp, data_type, data, received_at | PRIMARY KEY (id), INDEX (device_id, timestamp, data_type), FOREIGN KEY (device_id) | data使用JSON类型，可能影响查询性能 |
| sensor_data | id, device_id, type, temperature, humidity, smoke_level, max_temp, human_detected, fire_risk, env_status, battery, timestamp, received_at | PRIMARY KEY (id), INDEX (device_id, timestamp, temperature, humidity, smoke_level, human_detected, fire_risk), FOREIGN KEY (device_id) | 索引过多，可能影响写入性能 |

### 1.2 性能瓶颈分析

1. **数据类型问题**：
   - `battery`字段使用INT类型，实际取值范围较小，可优化为TINYINT
   - `device_id`和`robot_id`使用VARCHAR(50)，作为外键被多个表引用，查询时可能影响性能
   - JSON类型字段(temperature_data, data)查询性能较差

2. **索引问题**：
   - `sensor_data`表索引过多，可能影响写入性能
   - 缺少复合索引，特别是对于常用的查询组合
   - 某些索引可能重复或不必要

3. **关系定义问题**：
   - 外键引用使用VARCHAR类型，不如INT类型高效
   - 表之间的关联关系可能需要优化

4. **连接池配置问题**：
   - `acquireTimeout`参数可能设置不当
   - 连接池大小和其他参数可能需要调整

## 2. 优化方案

### 2.1 表结构优化

1. **优化数据类型**：
   - 将`battery`字段从INT改为TINYINT
   - 考虑为`device_id`和`robot_id`添加INT类型的代理键
   - 对于频繁查询的JSON字段，考虑拆分为单独的表

2. **优化索引**：
   - 减少`sensor_data`表的索引数量，保留最必要的索引
   - 添加复合索引以优化常用查询
   - 确保外键字段都有适当的索引

3. **优化关系定义**：
   - 考虑使用INT类型的代理键作为外键，提高查询性能
   - 优化表之间的关联关系，减少冗余

4. **连接池优化**：
   - 调整连接池大小和超时参数
   - 添加连接池监控和管理

### 2.2 具体优化措施

1. **传感器数据表(sensor_data)**：
   - 减少索引数量，保留device_id、timestamp和fire_risk等关键索引
   - 添加(device_id, timestamp)复合索引
   - 考虑将battery字段类型改为TINYINT

2. **设备数据表(device_data)**：
   - 添加(device_id, data_type, timestamp)复合索引
   - 考虑为频繁查询的JSON字段创建单独的表

3. **热成像表(thermal_images)**：
   - 考虑为temperature_data创建单独的表，或使用更高效的存储格式

4. **连接池配置**：
   - 调整connectionLimit、waitForConnections等参数
   - 移除无效的acquireTimeout参数

## 3. 实施计划

1. **第一阶段**：分析和设计优化方案
2. **第二阶段**：实施表结构和索引优化
3. **第三阶段**：优化连接池配置
4. **第四阶段**：进行性能测试和对比分析
5. **第五阶段**：生成优化报告和文档

## 4. 预期效果

- 提高查询性能，特别是对于时间范围和设备相关的查询
- 减少写入操作的开销
- 优化存储空间使用
- 提高系统整体响应速度
- 增强数据库的可维护性