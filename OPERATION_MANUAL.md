# 热成像传感器数据处理系统 - 操作手册

## 目录
1. [功能概述](#功能概述)
2. [适用场景](#适用场景)
3. [系统架构](#系统架构)
4. [详细操作步骤](#详细操作步骤)
5. [常见问题及解决方法](#常见问题及解决方法)
6. [注意事项](#注意事项)
7. [文件说明](#文件说明)
8. [数据格式规范](#数据格式规范)

---

## 功能概述

热成像传感器数据处理系统是一个基于 Node.js 的实时数据接收、验证、存储和管理平台。该系统通过 Socket 连接接收来自热成像传感器的实时数据，实现以下核心功能：

### 核心功能模块

1. **实时数据接收**
   - 基于 TCP Socket 的多客户端并发连接
   - 支持 UTF-8 编码的数据传输
   - 自动客户端识别和管理

2. **数据验证与转换**
   - 严格的 JSON 格式验证
   - 数据类型检查（字符串、数值、布尔值、枚举）
   - 温度矩阵维度验证（8x8 二维数组）
   - 数值范围约束验证

3. **文件系统存储**
   - 原始数据保存到 `data/raw/` 目录
   - 处理后数据保存到 `data/processed/` 目录
   - 结构化日志记录到 `logs/` 目录

4. **数据库持久化**
   - MySQL 数据库存储
   - 自动连接管理和错误恢复
   - 完整的索引优化

5. **监控与日志**
   - 实时控制台输出
   - 分级日志记录（INFO/ERROR/WARN）
   - 处理流程追踪

---

## 适用场景

### 1. 工业环境监测
- 工厂车间温度监控
- 设备过热预警
- 火灾隐患检测

### 2. 智能建筑管理
- 楼宇温度分布监测
- 空调系统优化
- 人员流动检测

### 3. 安防监控系统
- 夜间人员识别
- 异常温度区域告警
- 火灾早期预警

### 4. 数据中心运维
- 服务器机柜温度监控
- 热点区域识别
- 冷却系统效率评估

### 5. 农业温室监控
- 作物生长环境监控
- 温度均匀性分析
- 自动化环境调节

---

## 系统架构

```
┌─────────────────────────────────────────────────────────────────┐
│                        客户端设备                                │
│              (热成像传感器 / 模拟客户端)                          │
└──────────────────────┬──────────────────────────────────────────┘
                       │ TCP Socket 连接
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Socket Server                                │
│                  (socket-server.js)                              │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────────────┐ │
│  │ 连接管理    │  │ 数据接收     │  │ 错误处理                │ │
│  │ • 多客户端  │  │ • UTF-8编码  │  │ • ECONNRESET           │ │
│  │ • 超时控制  │  │ • 数据解析   │  │ • EPIPE                │ │
│  │ • 资源释放  │  │ • 长度检查   │  │ • ETIMEDOUT            │ │
│  └─────────────┘  └──────────────┘  └─────────────────────────┘ │
└──────────────────────┬──────────────────────────────────────────┘
                       │ 调用处理流程
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Data Processor                                │
│                  (data-processor.js)                             │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │              processRawData(rawData, clientInfo)           │  │
│  └───────────────────────────────────────────────────────────┘  │
└──────────────────────┬──────────────────────────────────────────┘
                       │
       ┌───────────────┼───────────────┐
       ▼               ▼               ▼
┌─────────────┐ ┌─────────────┐ ┌─────────────────┐
│   Validator │ │   Storage   │ │   Database      │
│  (data-     │ │  (data-     │ │  (MySQL)        │
│  validator) │ │  storage)   │ │                 │
│             │ │             │ │                 │
│ • JSON解析  │ │ • 原始数据  │ │ • 连接池管理    │
│ • 类型检查  │ │ • 处理后数据│ │ • 自动重连      │
│ • 范围验证  │ │ • 日志记录  │ │ • 事务支持      │
│ • 矩阵验证  │ │             │ │ • 索引优化      │
└─────────────┘ └─────────────┘ └─────────────────┘
```

---

## 详细操作步骤

### 步骤一：环境准备

#### 1.1 系统要求
- **操作系统**: Windows 10/11, Linux, macOS
- **Node.js**: 版本 14.x 或更高
- **MySQL**: 版本 5.7 或更高
- **内存**: 建议 4GB 以上
- **磁盘空间**: 建议 10GB 以上（用于数据存储）

#### 1.2 安装依赖
```bash
# 进入项目目录
cd c:\Users\ma170\Desktop\git\project

# 安装 Node.js 依赖
npm install

# 确认 MySQL 模块已安装
npm list mysql
```

#### 1.3 数据库配置
编辑数据库连接配置（如需要）：

**文件**: `data-processor.js`
```javascript
// 第 34-41 行
dbConnection = mysql.createConnection({
  host: 'localhost',      // 数据库主机地址
  user: 'root',           // 数据库用户名
  password: '12305',      // 数据库密码
  database: 'thermal_sensor_data',  // 数据库名称
  charset: 'utf8mb4'
});
```

### 步骤二：初始化数据库

#### 2.1 运行初始化脚本
```bash
node init-database.js
```

#### 2.2 预期输出
```
数据库连接成功
数据库创建/确认成功
表结构创建/确认成功
所有索引创建完成
数据库初始化完成！
```

#### 2.3 验证数据库结构
```sql
-- 登录 MySQL
mysql -u root -p

-- 查看数据库
SHOW DATABASES;

-- 使用数据库
USE thermal_sensor_data;

-- 查看表结构
DESCRIBE thermal_sensor_data;

-- 查看索引
SHOW INDEX FROM thermal_sensor_data;
```

### 步骤三：启动 Socket 服务器

#### 3.1 启动服务
```bash
node socket-server.js
```

#### 3.2 预期输出
```
[2026-03-11T16:35:42.069Z] [INFO] 数据处理器初始化完成
============================================================
[2026-03-11T16:35:42.075Z] 热成像传感器数据服务器已成功启动
[2026-03-11T16:35:42.076Z] 监听地址: 0.0.0.0:8080
[2026-03-11T16:35:42.076Z] 等待客户端连接...
============================================================

[2026-03-11T16:35:42.081Z] [INFO] 数据库连接成功，连接ID: 44
```

#### 3.3 验证服务状态
```bash
# Windows
netstat -an | findstr 8080

# Linux/macOS
netstat -tlnp | grep 8080
```

### 步骤四：测试数据发送

#### 4.1 使用测试客户端
```bash
node socket-client.js
```

#### 4.2 使用 Telnet 测试
```bash
telnet localhost 8080
```

#### 4.3 发送测试数据
```json
{
  "type": "THERMAL-SENSOR-001",
  "temperature": 25.5,
  "humidity": 65.2,
  "smoke_level": 0.15,
  "max_temp": [
    [22.5, 23.1, 24.2, 25.0, 25.8, 26.3, 26.8, 27.2],
    [23.0, 23.6, 24.8, 25.5, 26.2, 26.7, 27.1, 27.5],
    [23.5, 24.2, 25.3, 26.0, 26.8, 27.2, 27.6, 28.0],
    [24.0, 24.8, 25.9, 26.5, 27.2, 27.6, 28.1, 28.5],
    [24.5, 25.3, 26.4, 27.0, 27.7, 28.1, 28.6, 29.0],
    [25.0, 25.8, 26.9, 27.5, 28.2, 28.6, 29.1, 29.5],
    [25.5, 26.3, 27.4, 28.0, 28.7, 29.1, 29.6, 30.0],
    [26.0, 26.8, 27.9, 28.5, 29.2, 29.6, 30.1, 30.5]
  ],
  "human_detected": true,
  "fire_risk": "LOW",
  "env_status": "NORMAL",
  "battery": 85.5
}
```

### 步骤五：验证数据处理结果

#### 5.1 检查控制台输出
```
[2026-03-11T16:37:50.449Z] 客户端 #1 已连接 - 127.0.0.1:54994
[2026-03-11T16:37:50.450Z] 当前连接数: 1
[2026-03-11T16:37:50.451Z] 客户端 #1 (127.0.0.1:54994) 发送数据:
  数据内容: {...}
  数据长度: 488 字节
---
[2026-03-11T16:37:50.452Z] [INFO] 开始处理数据 [ID: 2026-03-11T16-37-50-452Z]
[2026-03-11T16:37:50.456Z] [INFO] 原始数据已保存: raw_2026-03-11T16-37-50-452Z.txt
[2026-03-11T16:37:50.457Z] [INFO] 数据验证通过 [ID: 2026-03-11T16-37-50-452Z]
[2026-03-11T16:37:50.465Z] [INFO] 数据已存入数据库 [ID: 2026-03-11T16-37-50-452Z], 记录ID: 1
[2026-03-11T16:37:50.467Z] [INFO] 处理后数据已保存: processed_2026-03-11T16-37-50-452Z.json
[2026-03-11T16:37:50.468Z] [INFO] 数据处理完成 [ID: 2026-03-11T16-37-50-452Z]
[2026-03-11T16:37:50.470Z] 数据处理成功 [ID: 2026-03-11T16-37-50-452Z]
```

#### 5.2 检查文件系统
```bash
# 查看原始数据
cat data/raw/raw_2026-03-11T16-37-50-452Z.txt

# 查看处理后数据
cat data/processed/processed_2026-03-11T16-37-50-452Z.json

# 查看日志
cat logs/processor_2026-03-12.log
```

#### 5.3 检查数据库
```sql
-- 查询最新数据
SELECT * FROM thermal_sensor_data ORDER BY id DESC LIMIT 5;
```

### 步骤六：停止服务

#### 6.1 正常关闭
在服务器控制台按 `Ctrl + C`

#### 6.2 预期输出
```
[2026-03-11T16:38:00.000Z] 收到退出信号，正在关闭服务器...
[2026-03-11T16:38:00.001Z] [INFO] 数据库连接已关闭
[2026-03-11T16:38:00.002Z] 服务器已成功关闭
```

---

## 常见问题及解决方法

### 问题 1：端口被占用

**错误信息**:
```
Error: listen EADDRINUSE: address already in use :::8080
```

**解决方法**:
```bash
# Windows
netstat -ano | findstr 8080
taskkill /PID <进程ID> /F

# Linux/macOS
lsof -i :8080
kill -9 <进程ID>
```

**预防措施**:
- 确保没有重复启动服务
- 检查系统启动项
- 使用不同的端口号（修改 socket-server.js 中的 PORT 常量）

### 问题 2：数据库连接失败

**错误信息**:
```
[ERROR] 数据库连接失败: ER_ACCESS_DENIED_ERROR
```

**解决方法**:
1. 检查数据库服务是否运行
   ```bash
   # Windows
   net start mysql
   
   # Linux
   sudo systemctl status mysql
   ```

2. 验证连接配置
   - 用户名和密码是否正确
   - 主机地址是否可达
   - 数据库是否存在

3. 创建数据库和用户
   ```sql
   CREATE DATABASE thermal_sensor_data CHARACTER SET utf8mb4;
   GRANT ALL PRIVILEGES ON thermal_sensor_data.* TO 'root'@'localhost';
   FLUSH PRIVILEGES;
   ```

### 问题 3：数据验证失败

**错误信息**:
```
数据处理失败: 字段 temperature 超出范围 [-50, 150]: 200
```

**解决方法**:
1. 检查数据格式是否符合规范
2. 确认数值在允许范围内
3. 验证 JSON 格式是否正确

**调试方法**:
```javascript
// 在 data-validator.js 中添加调试日志
console.log('验证数据:', parsedData);
```

### 问题 4：客户端连接断开

**错误信息**:
```
[ERROR] 客户端 #1 连接错误: read ECONNRESET
```

**解决方法**:
- 检查网络连接稳定性
- 增加心跳检测机制
- 实现自动重连逻辑

### 问题 5：磁盘空间不足

**错误信息**:
```
Error: ENOSPC: no space left on device
```

**解决方法**:
1. 清理旧数据文件
   ```bash
   # 删除 30 天前的数据
   find data/raw -name "*.txt" -mtime +30 -delete
   find data/processed -name "*.json" -mtime +30 -delete
   ```

2. 归档历史数据
   ```bash
   tar -czf archive_$(date +%Y%m%d).tar.gz data/
   ```

3. 监控磁盘使用
   ```bash
   df -h
   ```

---

## 注意事项

### 1. 安全性
- **生产环境**务必修改默认数据库密码
- 使用防火墙限制 Socket 端口访问
- 定期备份数据库
- 敏感数据加密存储

### 2. 性能优化
- 监控数据库连接数，避免连接泄漏
- 定期清理过期日志文件
- 大数据量时考虑分表或分区
- 使用 SSD 存储提高 I/O 性能

### 3. 数据保留策略
- 原始数据：建议保留 30 天
- 处理后数据：建议保留 90 天
- 日志文件：建议保留 7 天
- 数据库数据：根据业务需求设定

### 4. 监控告警
- 设置数据库连接异常告警
- 监控磁盘空间使用率
- 跟踪数据处理失败率
- 记录客户端连接数峰值

### 5. 维护窗口
- 建议在低峰期进行系统维护
- 更新前备份配置文件
- 数据库结构变更需谨慎
- 保留回滚方案

---

## 文件说明

### 核心模块文件

#### 1. socket-server.js
**路径**: `c:\Users\ma170\Desktop\git\project\socket-server.js`

**功能作用**:
- Socket 服务端主程序
- 监听 TCP 8080 端口
- 管理多客户端连接
- 接收并分发数据到处理器

**关键代码模块**:
```javascript
// 服务器创建和配置
const server = net.createServer((socket) => {
  // 客户端连接处理
  socket.setEncoding('utf8');
  
  // 数据接收处理
  socket.on('data', async (data) => {
    const result = await dataProcessor.processRawData(data, clientInfo);
  });
  
  // 错误处理
  socket.on('error', (error) => {
    // ECONNRESET, ETIMEDOUT, EPIPE 处理
  });
});
```

**配置项**:
| 配置项 | 默认值 | 说明 |
|--------|--------|------|
| PORT | 8080 | 监听端口 |
| HOST | 0.0.0.0 | 绑定地址 |
| 超时时间 | 300000ms | 连接超时 |

---

#### 2. data-processor.js
**路径**: `c:\Users\ma170\Desktop\git\project\data-processor.js`

**功能作用**:
- 数据处理核心协调器
- 初始化数据库连接
- 创建必要的目录结构
- 提供日志记录功能

**关键代码模块**:
```javascript
// 初始化函数
function initialize() {
  // 创建日志和数据目录
  // 初始化数据库连接
}

// 数据处理主流程
async function processRawData(rawData, clientInfo) {
  // 1. 保存原始数据
  // 2. 验证和解析数据
  // 3. 存入数据库
  // 4. 保存处理后数据
}

// 日志记录
function log(level, message) {
  // 控制台输出 + 文件记录
}
```

**目录结构**:
```
project/
├── logs/              # 日志文件
│   └── processor_YYYY-MM-DD.log
├── data/              # 数据文件
│   ├── raw/          # 原始数据
│   └── processed/    # 处理后数据
```

---

#### 3. data-validator.js
**路径**: `c:\Users\ma170\Desktop\git\project\data-validator.js`

**功能作用**:
- JSON 数据解析
- 数据类型验证
- 数值范围检查
- 枚举值验证
- 温度矩阵验证

**关键代码模块**:
```javascript
// 主验证函数
function parseAndValidateData(rawData, processingId) {
  const parsedData = JSON.parse(rawData);
  
  return {
    sensor_type: validateString(parsedData.type, 'sensor_type', 50),
    temperature: validateNumber(parsedData.temperature, 'temperature', -50, 150),
    humidity: validateNumber(parsedData.humidity, 'humidity', 0, 100),
    max_temp: validateTemperatureMatrix(parsedData.max_temp),
    // ... 其他字段验证
  };
}

// 温度矩阵验证
function validateTemperatureMatrix(matrix) {
  // 验证 8x8 矩阵结构
  // 验证每个元素为数值
}
```

**验证规则**:
| 字段 | 类型 | 范围/约束 | 说明 |
|------|------|-----------|------|
| sensor_type | string | 最大50字符 | 传感器标识 |
| temperature | number | -50 ~ 150 | 摄氏度 |
| humidity | number | 0 ~ 100 | 百分比 |
| smoke_level | number | 0 ~ 1 | 烟雾浓度 |
| max_temp | array | 8x8矩阵 | 温度分布 |
| human_detected | boolean | true/false | 人员检测 |
| fire_risk | enum | LOW/MEDIUM/HIGH/CRITICAL | 火灾风险 |
| env_status | enum | NORMAL/WARNING/ALERT/EMERGENCY | 环境状态 |
| battery | number | 0 ~ 100 | 电量百分比 |

---

#### 4. data-storage.js
**路径**: `c:\Users\ma170\Desktop\git\project\data-storage.js`

**功能作用**:
- 原始数据文件存储
- 处理后数据 JSON 存储
- 数据库插入操作

**关键代码模块**:
```javascript
// 保存原始数据
function saveRawData(rawData, processingId, clientInfo) {
  const content = `处理ID: ${processingId}
客户端: ${clientInfo}
时间: ${new Date().toISOString()}
原始数据:
${rawData}`;
  fs.writeFileSync(filepath, content, 'utf8');
}

// 数据库插入
function saveToDatabase(data, processingId) {
  const sql = `INSERT INTO thermal_sensor_data ...`;
  dbConnection.query(sql, values, callback);
}
```

---

#### 5. init-database.js
**路径**: `c:\Users\ma170\Desktop\git\project\init-database.js`

**功能作用**:
- 创建数据库
- 创建数据表
- 创建索引
- 初始化数据库结构

**关键代码模块**:
```javascript
// 创建数据库
CREATE DATABASE IF NOT EXISTS thermal_sensor_data;

// 创建表
CREATE TABLE IF NOT EXISTS thermal_sensor_data (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  sensor_type VARCHAR(50) NOT NULL,
  temperature DECIMAL(5, 2) NOT NULL,
  // ... 其他字段
);

// 创建索引
CREATE INDEX idx_sensor_type ON thermal_sensor_data(sensor_type);
```

**表结构**:
| 字段名 | 数据类型 | 约束 | 说明 |
|--------|----------|------|------|
| id | BIGINT UNSIGNED | PK, AUTO_INCREMENT | 主键 |
| sensor_type | VARCHAR(50) | NOT NULL | 传感器类型 |
| temperature | DECIMAL(5,2) | NOT NULL | 温度 |
| humidity | DECIMAL(5,2) | NOT NULL | 湿度 |
| smoke_level | DECIMAL(5,3) | DEFAULT 0 | 烟雾级别 |
| max_temp | JSON | NOT NULL | 温度矩阵 |
| human_detected | BOOLEAN | DEFAULT FALSE | 人员检测 |
| fire_risk | ENUM | DEFAULT 'LOW' | 火灾风险 |
| env_status | ENUM | DEFAULT 'NORMAL' | 环境状态 |
| battery | DECIMAL(5,2) | NOT NULL | 电量 |
| recorded_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 记录时间 |

---

#### 6. socket-client.js
**路径**: `c:\Users\ma170\Desktop\git\project\socket-client.js`

**功能作用**:
- 测试客户端程序
- 模拟传感器发送数据
- 验证服务器响应

**使用方法**:
```bash
node socket-client.js
```

---

#### 7. thermal_sensor_sample.json
**路径**: `c:\Users\ma170\Desktop\git\project\thermal_sensor_sample.json`

**功能作用**:
- 数据格式参考模板
- 定义标准数据格式
- 用于客户端开发参考

**数据格式示例**:
```json
{
  "type": "THERMAL-SENSOR-001",
  "temperature": 25.5,
  "humidity": 65.2,
  "smoke_level": 0.15,
  "max_temp": [[...], [...], ...],  // 8x8 矩阵
  "human_detected": true,
  "fire_risk": "LOW",
  "env_status": "NORMAL",
  "battery": 85.5
}
```

---

## 数据格式规范

### 输入数据格式 (JSON)

```json
{
  "type": "THERMAL-SENSOR-001",           // 传感器类型/设备ID
  "temperature": 25.5,                     // 当前温度 (°C)
  "humidity": 65.2,                        // 湿度 (%)
  "smoke_level": 0.15,                     // 烟雾级别 (0-1)
  "max_temp": [                            // 8x8 温度矩阵
    [22.5, 23.1, 24.2, 25.0, 25.8, 26.3, 26.8, 27.2],
    [23.0, 23.6, 24.8, 25.5, 26.2, 26.7, 27.1, 27.5],
    [23.5, 24.2, 25.3, 26.0, 26.8, 27.2, 27.6, 28.0],
    [24.0, 24.8, 25.9, 26.5, 27.2, 27.6, 28.1, 28.5],
    [24.5, 25.3, 26.4, 27.0, 27.7, 28.1, 28.6, 29.0],
    [25.0, 25.8, 26.9, 27.5, 28.2, 28.6, 29.1, 29.5],
    [25.5, 26.3, 27.4, 28.0, 28.7, 29.1, 29.6, 30.0],
    [26.0, 26.8, 27.9, 28.5, 29.2, 29.6, 30.1, 30.5]
  ],
  "human_detected": true,                  // 是否检测到人
  "fire_risk": "LOW",                      // 火灾风险等级
  "env_status": "NORMAL",                  // 环境状态
  "battery": 85.5                          // 电池电量 (%)
}
```

### 字段约束

| 字段 | 必填 | 类型 | 最小值 | 最大值 | 说明 |
|------|------|------|--------|--------|------|
| type | 是 | string | - | 50字符 | 设备标识 |
| temperature | 是 | number | -50 | 150 | 摄氏度 |
| humidity | 是 | number | 0 | 100 | 百分比 |
| smoke_level | 是 | number | 0 | 1 | 浓度比例 |
| max_temp | 是 | array | - | - | 8x8矩阵 |
| human_detected | 是 | boolean | - | - | true/false |
| fire_risk | 是 | string | - | - | 枚举值 |
| env_status | 是 | string | - | - | 枚举值 |
| battery | 是 | number | 0 | 100 | 百分比 |

### 枚举值定义

**fire_risk (火灾风险)**:
- `LOW` - 低风险
- `MEDIUM` - 中等风险
- `HIGH` - 高风险
- `CRITICAL` - 危急

**env_status (环境状态)**:
- `NORMAL` - 正常
- `WARNING` - 警告
- `ALERT` - 警报
- `EMERGENCY` - 紧急

---

## 附录

### A. 日志级别说明

| 级别 | 用途 | 示例 |
|------|------|------|
| INFO | 正常操作记录 | 数据保存成功、客户端连接 |
| WARN | 警告信息 | 数据库未连接、数据格式异常 |
| ERROR | 错误信息 | 数据库插入失败、文件写入失败 |

### B. 错误代码对照表

| 错误代码 | 说明 | 处理建议 |
|----------|------|----------|
| ECONNRESET | 连接被重置 | 客户端异常断开，无需处理 |
| EPIPE | 管道断裂 | 客户端已关闭，清理资源 |
| ETIMEDOUT | 连接超时 | 检查网络或增加超时时间 |
| EADDRINUSE | 端口被占用 | 更换端口或关闭占用进程 |
| ER_ACCESS_DENIED | 数据库权限不足 | 检查用户名密码 |
| ER_NO_SUCH_TABLE | 表不存在 | 运行初始化脚本 |

### C. 性能指标参考

| 指标 | 目标值 | 说明 |
|------|--------|------|
| 并发连接数 | 100+ | 同时在线客户端 |
| 数据处理延迟 | < 100ms | 从接收到存储完成 |
| 数据库响应 | < 50ms | 单条插入操作 |
| 日志写入 | < 10ms | 单条日志记录 |

---

**文档版本**: 1.0  
**最后更新**: 2026-03-12  
**维护人员**: 开发团队
