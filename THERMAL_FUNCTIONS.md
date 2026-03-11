# 热成像功能技术文档

## 1. 功能概述

热成像功能提供了8x8温度矩阵数据的实时采集、存储、传输和可视化功能。主要包括：

- 数据验证和格式化
- 数据库存储和管理
- Server-Sent Events (SSE) 实时传输
- REST API 接口
- 前端可视化展示

## 2. 数据库结构

### 2.1 表结构

**表名**: `thermal_data`

| 字段名 | 数据类型 | 约束 | 描述 |
|-------|---------|------|------|
| `id` | `INT` | `PRIMARY KEY AUTO_INCREMENT` | 自增主键 |
| `data_id` | `VARCHAR(50)` | `UNIQUE NOT NULL` | 热成像数据唯一标识 |
| `device_id` | `VARCHAR(50)` | `NOT NULL` | 设备ID |
| `matrix_data` | `JSON` | `NOT NULL` | 8x8温度矩阵数据 |
| `max_temp` | `DECIMAL(5,2)` | `NOT NULL` | 最高温度值 |
| `min_temp` | `DECIMAL(5,2)` | `NOT NULL` | 最低温度值 |
| `avg_temp` | `DECIMAL(5,2)` | `NOT NULL` | 平均温度值 |
| `row_count` | `INT` | `NOT NULL DEFAULT 8` | 矩阵行数 |
| `col_count` | `INT` | `NOT NULL DEFAULT 8` | 矩阵列数 |
| `recorded_at` | `DATETIME` | `NOT NULL` | 数据记录时间戳 |
| `created_at` | `DATETIME` | `DEFAULT CURRENT_TIMESTAMP` | 记录创建时间 |
| `updated_at` | `DATETIME` | `DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP` | 记录更新时间 |

### 2.2 索引

| 索引名 | 类型 | 字段 | 描述 |
|-------|------|------|------|
| `PRIMARY` | `BTREE` | `id` | 主键索引 |
| `unique_data_id` | `BTREE` | `data_id` | 数据ID唯一索引 |
| `idx_device_id` | `BTREE` | `device_id` | 设备ID索引 |
| `idx_recorded_at` | `BTREE` | `recorded_at` | 记录时间索引 |
| `idx_created_at` | `BTREE` | `created_at` | 创建时间索引 |

## 3. API 接口

### 3.1 SSE 实时传输

**端点**: `/thermal/thermal-stream`

**方法**: `GET`

**描述**: 实时推送热成像数据，每1秒发送一次数据

**响应格式**: Server-Sent Events (SSE)

```
data: {"dataId": "THERMAL-1234567890", "deviceId": "THERMAL-001", "timestamp": "2026-03-11T13:32:19.000Z", "matrix": [[15.0, 15.8, ...], ...], "maxTemp": "23.00", "minTemp": "13.80", "avgTemp": "17.93", "rowCount": 8, "colCount": 8}
```

### 3.2 REST API

#### 3.2.1 获取最新热成像数据

**端点**: `/thermal/latest-thermal`

**方法**: `GET`

**描述**: 获取最新的一条热成像数据

**响应**: 
```json
{
  "success": true,
  "data": {
    "id": 1,
    "dataId": "THERMAL-1234567890",
    "deviceId": "THERMAL-001",
    "matrix": [[15.0, 15.8, ...], ...],
    "maxTemp": "23.00",
    "minTemp": "13.80",
    "avgTemp": "17.93",
    "rowCount": 8,
    "colCount": 8,
    "timestamp": "2026-03-11T13:32:19.000Z",
    "createdAt": "2026-03-11T13:32:19.000Z"
  }
}
```

#### 3.2.2 获取历史热成像数据

**端点**: `/thermal/thermal-history`

**方法**: `GET`

**参数**: 
- `limit`: 限制返回数量（默认10，最大100）
- `offset`: 偏移量（默认0）

**描述**: 分页获取历史热成像数据

**响应**: 
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "limit": 10,
    "offset": 0,
    "count": 10
  }
}
```

#### 3.2.3 手动提交热成像数据

**端点**: `/thermal/thermal-data`

**方法**: `POST`

**请求体**: 
```json
{
  "matrix": [[15.0, 15.8, ...], ...], // 8x8温度矩阵
  "deviceId": "THERMAL-001",
  "maxTemp": "23.00", // 可选，自动计算
  "minTemp": "13.80", // 可选，自动计算
  "avgTemp": "17.93"  // 可选，自动计算
}
```

**响应**: 
```json
{
  "success": true,
  "message": "数据保存成功",
  "data": {
    "dataId": "THERMAL-1234567890",
    "timestamp": "2026-03-11T13:32:19.000Z"
  }
}
```

## 4. 数据验证规则

### 4.1 温度矩阵
- **维度**: 严格8行8列
- **温度范围**: -40°C ~ 150°C
- **数值类型**: 所有温度值必须为有效数字

### 4.2 设备ID
- **格式**: `THERMAL-XXX` 格式（字母数字组合）

### 4.3 统计数据
- **最高温度**: 必须在有效范围内
- **最低温度**: 必须在有效范围内
- **平均温度**: 必须在有效范围内

## 5. 前端实现

### 5.1 页面结构
- **URL**: `/thermal-monitor.html`
- **布局**: 8x8热成像网格，信息面板，状态显示

### 5.2 功能特性
- **实时数据**: 通过SSE接收实时数据
- **错误处理**: 自动重连，错误提示
- **数据验证**: 前端数据格式验证
- **响应式设计**: 适配不同屏幕尺寸

### 5.3 颜色映射
- < 20°C: 蓝色
- 20-25°C: 绿色
- 25-30°C: 黄色
- 30-35°C: 橙色
- > 35°C: 红色

## 6. 代码结构

### 6.1 核心文件
- `routes/thermal.js`: 热成像功能核心代码
- `public/thermal-monitor.html`: 前端可视化页面
- `create_thermal_data_table.js`: 数据库表创建脚本

### 6.2 主要函数

#### 6.2.1 `validateThermalData(data)`
- **功能**: 验证热成像数据格式
- **参数**: 热成像数据对象
- **返回**: `{valid: boolean, errors: string[]}`

#### 6.2.2 `calculateStats(matrix)`
- **功能**: 计算温度矩阵的统计值
- **参数**: 温度矩阵（二维数组）
- **返回**: `{max: string, min: string, avg: string}`

#### 6.2.3 `saveThermalData(data)`
- **功能**: 将热成像数据保存到数据库
- **参数**: 热成像数据对象
- **返回**: Promise

#### 6.2.4 `getLatestThermalData(limit)`
- **功能**: 获取最新的热成像数据
- **参数**: 限制返回数量
- **返回**: Promise<Array>

## 7. 错误处理

### 7.1 服务器端错误处理
- **数据验证错误**: 返回具体的验证失败信息
- **数据库错误**: 捕获并记录错误，返回友好的错误信息
- **SSE连接错误**: 自动重连机制，连续5次错误后关闭连接

### 7.2 客户端错误处理
- **连接错误**: 自动重连，显示错误提示
- **数据解析错误**: 显示解析失败提示
- **数据格式错误**: 显示格式验证错误信息

## 8. 测试

### 8.1 测试项目
- [x] 数据验证功能
- [x] 数据存储功能
- [x] 数据查询功能
- [x] SSE实时传输
- [x] 前端数据显示
- [x] 错误处理机制

### 8.2 测试结果
所有测试项目均通过，热成像功能正常运行。

## 9. 性能优化

### 9.1 数据库优化
- 合理的索引设计，优化查询性能
- JSON格式存储矩阵数据，减少数据传输量

### 9.2 网络优化
- SSE连接复用，减少连接建立开销
- 数据压缩，减少传输带宽

### 9.3 前端优化
- 高效的DOM操作，减少重绘和回流
- 响应式设计，适配不同设备

## 10. 使用示例

### 10.1 前端使用

```javascript
// 初始化SSE连接
const eventSource = new EventSource('/thermal/thermal-stream');

eventSource.onmessage = function(event) {
  const data = JSON.parse(event.data);
  // 更新热成像网格
  updateThermalGrid(data.matrix);
  // 更新统计信息
  updateStats(data);
};
```

### 10.2 后端API调用

```javascript
// 获取最新数据
fetch('/thermal/latest-thermal')
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      console.log('最新热成像数据:', data.data);
    }
  });

// 提交数据
fetch('/thermal/thermal-data', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    matrix: [[15.0, 15.8, ...], ...],
    deviceId: 'THERMAL-001'
  })
});
```

## 11. 版本历史

| 版本 | 日期 | 变更内容 |
|------|------|----------|
| 1.0 | 2026-03-11 | 初始实现，包含完整的热成像功能 |

## 12. 技术栈

- **后端**: Node.js, Express, MySQL
- **前端**: HTML5, CSS3, JavaScript
- **实时传输**: Server-Sent Events (SSE)
- **数据格式**: JSON

## 13. 维护说明

### 13.1 数据库维护
- 定期清理过期数据，避免表过大
- 监控数据库性能，必要时优化索引

### 13.2 代码维护
- 遵循代码规范，保持代码可读性
- 定期更新依赖包，确保安全性
- 记录代码变更，便于问题追踪

### 13.3 故障排查
- 检查服务器日志，定位错误原因
- 验证数据库连接和数据格式
- 测试网络连接和SSE传输

## 14. 扩展建议

### 14.1 功能扩展
- 支持多设备热成像数据管理
- 添加数据趋势分析和告警功能
- 集成机器学习模型，实现异常检测

### 14.2 性能扩展
- 使用Redis缓存热点数据
- 实现数据分片存储，支持大规模部署
- 优化SSE连接管理，支持更多并发连接

### 14.3 安全扩展
- 添加身份认证和授权机制
- 实现数据加密传输
- 定期安全审计和漏洞扫描
