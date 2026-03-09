# SSE 实时温度数据传输系统 API 文档

## 概述

本文档描述了基于服务器发送事件 (SSE) 的实时温度数据传输系统的 API 接口。该系统从数据库中获取温度传感器数据并持续推送到前端应用，支持低延迟、高可靠性的实时数据传输。

## 基础信息

- **基础 URL**: `http://localhost:3000/api/sse`
- **数据格式**: JSON / SSE (Server-Sent Events)
- **字符编码**: UTF-8
- **协议**: HTTP/1.1 (支持长连接)

---

## 核心特性

### 1. 实时数据推送
- 基于 SSE 技术的单向实时数据推送
- 支持可配置的推送间隔（100ms - 60000ms）
- 自动心跳保持连接（30 秒间隔）

### 2. 数据查询与过滤
- 支持按机器人 ID 过滤
- 支持按任务 ID 过滤
- 支持时间范围查询
- 可配置数据精度（0-5 位小数）

### 3. 连接管理
- 自动重连机制（最多 5 次，间隔 5 秒）
- 连接状态监控
- 客户端连接管理

### 4. 数据验证与错误处理
- 完整的参数验证
- 友好的错误提示
- 连接异常处理

---

## API 接口

### 1. 建立温度数据 SSE 连接

**接口**: `GET /api/sse/temperature/stream`

**描述**: 建立 SSE 长连接，实时接收温度传感器数据

**请求参数**:

| 参数 | 类型 | 必填 | 默认值 | 说明 | 验证规则 |
|------|------|------|--------|------|----------|
| robot_id | number | 否 | null | 机器人 ID | 正整数 |
| task_id | number | 否 | null | 任务 ID | 正整数 |
| interval | number | 否 | 1000 | 推送间隔（毫秒） | 100-60000 |
| precision | number | 否 | 2 | 数据精度（小数位数） | 0-5 |
| include_humidity | boolean | 否 | true | 是否包含湿度数据 | true/false |
| include_alerts | boolean | 否 | false | 是否包含告警信息 | true/false |

**请求示例**:
```bash
GET /api/sse/temperature/stream?robot_id=1&interval=1000&precision=2
```

**SSE 数据流格式**:

**连接成功消息**:
```json
{
  "type": "connected",
  "clientId": "client_1_1773071380995",
  "timestamp": "2026-03-09T15:49:40.995Z"
}
```

**初始数据消息**:
```json
{
  "type": "initial_data",
  "data": {
    "data_id": 82,
    "robot_id": 27,
    "temperature": 43.91,
    "humidity": 58.78,
    "smoke_level": 9.714,
    "max_temp": 40.93,
    "fire_risk": 0,
    "env_status": 0,
    "battery": 88,
    "timestamp": 1773069918165
  },
  "timestamp": "2026-03-09T15:51:18.569Z"
}
```

**温度更新消息**:
```json
{
  "type": "temperature_update",
  "data": {
    "data_id": 82,
    "robot_id": 27,
    "task_id": 127,
    "temperature": 43.91,
    "humidity": 58.78,
    "smoke_level": 9.714,
    "max_temp": 40.93,
    "fire_risk": 0,
    "env_status": 0,
    "battery": 88,
    "timestamp": 1773069918165
  },
  "timestamp": "2026-03-09T15:51:19.569Z"
}
```

**心跳消息**:
```json
{
  "type": "heartbeat",
  "timestamp": "2026-03-09T15:51:48.569Z"
}
```

**错误消息**:
```json
{
  "type": "error",
  "message": "获取温度数据失败",
  "timestamp": "2026-03-09T15:51:48.569Z"
}
```

**前端 JavaScript 示例**:
```javascript
const eventSource = new EventSource(
  'http://localhost:3000/api/sse/temperature/stream?interval=1000'
);

eventSource.onopen = (event) => {
  console.log('SSE 连接已建立');
};

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  switch(data.type) {
    case 'connected':
      console.log('连接成功，客户端 ID:', data.clientId);
      break;
    case 'temperature_update':
      console.log('温度更新:', data.data.temperature, '°C');
      break;
    case 'heartbeat':
      console.log('心跳包:', data.timestamp);
      break;
    case 'error':
      console.error('服务器错误:', data.message);
      break;
  }
};

eventSource.onerror = (error) => {
  console.error('SSE 连接错误:', error);
  eventSource.close();
};
```

---

### 2. 获取温度历史数据

**接口**: `GET /api/sse/temperature/history`

**描述**: 获取历史温度数据记录

**请求参数**:

| 参数 | 类型 | 必填 | 默认值 | 说明 | 验证规则 |
|------|------|------|--------|------|----------|
| robot_id | number | 否 | null | 机器人 ID | 正整数 |
| task_id | number | 否 | null | 任务 ID | 正整数 |
| startTime | string | 否 | null | 开始时间（ISO 格式） | 有效日期 |
| endTime | string | 否 | null | 结束时间（ISO 格式） | 有效日期 |
| limit | number | 否 | 100 | 返回记录数限制 | 1-1000 |
| precision | number | 否 | 2 | 数据精度 | 0-5 |

**请求示例**:
```bash
GET /api/sse/temperature/history?robot_id=1&limit=50&startTime=2026-03-09T00:00:00Z
```

**成功响应** (200):
```json
{
  "success": true,
  "data": [
    {
      "data_id": 82,
      "msg_id": 2082,
      "robot_id": 27,
      "task_id": 127,
      "data_time": "2026-03-09T15:25:18.165Z",
      "temperature": 43.91,
      "humidity": 58.78,
      "smoke_level": 9.714,
      "max_temp": 40.93,
      "fire_risk": 0,
      "env_status": 0,
      "battery": 88,
      "timestamp": 1773069918165
    }
  ],
  "count": 10,
  "timestamp": "2026-03-09T15:50:07.898Z"
}
```

---

### 3. 获取温度统计数据

**接口**: `GET /api/sse/temperature/stats`

**描述**: 获取温度统计数据（平均值、最小值、最大值等）

**请求参数**:

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| robot_id | number | 否 | null | 机器人 ID |
| startTime | string | 否 | null | 开始时间（ISO 格式） |
| endTime | string | 否 | null | 结束时间（ISO 格式） |

**请求示例**:
```bash
GET /api/sse/temperature/stats?robot_id=1
```

**成功响应** (200):
```json
{
  "success": true,
  "data": {
    "total_count": 200,
    "avg_temp": "35.42",
    "min_temp": "20.44",
    "max_temp": "49.73",
    "avg_humidity": "57.90"
  },
  "timestamp": "2026-03-09T15:50:20.518Z"
}
```

---

### 4. 获取温度告警数据

**接口**: `GET /api/sse/temperature/alerts`

**描述**: 获取温度告警记录（超过阈值或火灾风险）

**请求参数**:

| 参数 | 类型 | 必填 | 默认值 | 说明 | 验证规则 |
|------|------|------|--------|------|----------|
| robot_id | number | 否 | null | 机器人 ID | 正整数 |
| temp_threshold | number | 否 | 50 | 温度阈值（°C） | 数字 |
| limit | number | 否 | 50 | 返回记录数限制 | 1-1000 |

**告警级别说明**:
- **normal**: 正常（温度 < 50°C 且 fire_risk = 0）
- **caution**: 注意（温度 ≥ 50°C 或 fire_risk = 1）
- **warning**: 警告（温度 ≥ 60°C 或 fire_risk = 2）
- **critical**: 严重（温度 ≥ 80°C 或 fire_risk ≥ 3）

**请求示例**:
```bash
GET /api/sse/temperature/alerts?temp_threshold=40&limit=20
```

**成功响应** (200):
```json
{
  "success": true,
  "data": [
    {
      "data_id": 82,
      "robot_id": 27,
      "task_id": 127,
      "data_time": "2026-03-09T15:25:18.165Z",
      "temperature": 43.91,
      "max_temp": 40.93,
      "fire_risk": 0,
      "env_status": 0,
      "alert_level": "normal",
      "timestamp": 1773069918165
    }
  ],
  "count": 50,
  "timestamp": "2026-03-09T15:50:47.267Z"
}
```

---

### 5. 获取连接状态

**接口**: `GET /api/sse/connections`

**描述**: 获取当前所有 SSE 连接的状态信息

**请求示例**:
```bash
GET /api/sse/connections
```

**成功响应** (200):
```json
{
  "success": true,
  "data": {
    "total_connections": 1,
    "clients": [
      {
        "id": "client_1_1773071380995",
        "connectedAt": "2026-03-09T15:49:40.995Z",
        "lastPingAt": "2026-03-09T15:50:57.353Z",
        "options": {
          "robot_id": 1,
          "task_id": null,
          "precision": 2,
          "interval": 2000,
          "include_humidity": false,
          "include_alerts": false
        }
      }
    ],
    "timestamp": "2026-03-09T15:50:57.404Z"
  }
}
```

---

### 6. 断开指定连接

**接口**: `DELETE /api/sse/connections/:clientId`

**描述**: 手动断开指定的 SSE 连接

**请求参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| clientId | string | 是 | 客户端 ID（从连接响应中获取） |

**请求示例**:
```bash
DELETE /api/sse/connections/client_1_1773071380995
```

**成功响应** (200):
```json
{
  "success": true,
  "message": "客户端已断开连接",
  "timestamp": "2026-03-09T15:50:57.404Z"
}
```

---

## 错误处理

### HTTP 状态码

| 状态码 | 说明 |
|--------|------|
| 200 | 请求成功 |
| 400 | 请求参数错误 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |

### 错误响应格式

```json
{
  "success": false,
  "message": "错误描述信息",
  "errors": ["具体错误列表"]
}
```

### 常见错误

**参数验证失败** (400):
```json
{
  "success": false,
  "message": "参数验证失败",
  "errors": [
    "robot_id 必须是正整数",
    "interval 必须在 100-60000 毫秒之间"
  ]
}
```

---

## 前端完整示例

### HTML + JavaScript 示例

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>温度监控系统</title>
</head>
<body>
  <h1>实时温度监控</h1>
  <div id="status">状态：未连接</div>
  <div id="temperature">温度：-- °C</div>
  <div id="humidity">湿度：-- %</div>
  <div id="log"></div>

  <script>
    class TemperatureMonitor {
      constructor() {
        this.eventSource = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
      }

      connect(options = {}) {
        const params = new URLSearchParams(options);
        const url = `http://localhost:3000/api/sse/temperature/stream?${params}`;
        
        this.eventSource = new EventSource(url);
        
        this.eventSource.onopen = () => {
          this.log('SSE 连接已建立');
          this.updateStatus('已连接');
          this.reconnectAttempts = 0;
        };
        
        this.eventSource.onmessage = (event) => {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        };
        
        this.eventSource.onerror = () => {
          this.log('SSE 连接错误，尝试重连...');
          this.updateStatus('连接断开');
          this.handleReconnect(options);
        };
      }

      handleMessage(data) {
        switch(data.type) {
          case 'connected':
            this.log(`连接成功，客户端 ID: ${data.clientId}`);
            break;
          case 'temperature_update':
            this.updateDisplay(data.data);
            this.log(`温度更新：${data.data.temperature}°C`);
            break;
          case 'heartbeat':
            this.log('心跳包');
            break;
          case 'error':
            this.log(`错误：${data.message}`);
            break;
        }
      }

      updateDisplay(data) {
        document.getElementById('temperature').textContent = 
          `温度：${data.temperature}°C`;
        document.getElementById('humidity').textContent = 
          `湿度：${data.humidity}%`;
      }

      updateStatus(status) {
        document.getElementById('status').textContent = `状态：${status}`;
      }

      log(message) {
        const logDiv = document.getElementById('log');
        const time = new Date().toLocaleTimeString();
        logDiv.innerHTML += `[${time}] ${message}<br>`;
        logDiv.scrollTop = logDiv.scrollHeight;
      }

      handleReconnect(options) {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          this.log('达到最大重连次数，停止重连');
          return;
        }

        this.reconnectAttempts++;
        setTimeout(() => {
          this.log(`第 ${this.reconnectAttempts} 次重连...`);
          this.connect(options);
        }, 5000);
      }

      disconnect() {
        if (this.eventSource) {
          this.eventSource.close();
          this.eventSource = null;
          this.log('已断开连接');
        }
      }
    }

    // 使用示例
    const monitor = new TemperatureMonitor();
    
    // 连接 SSE
    monitor.connect({
      robot_id: 1,
      interval: 1000,
      precision: 2,
      include_humidity: true
    });

    // 页面关闭时断开连接
    window.addEventListener('beforeunload', () => {
      monitor.disconnect();
    });
  </script>
</body>
</html>
```

---

## 性能优化建议

### 1. 推送间隔配置
- **实时监控**: 100-500ms
- **常规监控**: 1000-2000ms
- **低功耗模式**: 5000-10000ms

### 2. 数据精度选择
- **高精度**: 3-5 位小数（科研场景）
- **标准精度**: 2 位小数（常规场景）
- **低精度**: 0-1 位小数（概览场景）

### 3. 连接管理
- 避免同时建立过多 SSE 连接（建议 < 10）
- 使用 robot_id 过滤减少数据传输量
- 及时断开不需要的连接

### 4. 重连策略
- 指数退避：5s, 10s, 20s, 40s, 80s
- 最大重连次数：5 次
- 重连失败后提示用户手动刷新

---

## 安全注意事项

1. **生产环境配置**
   - 启用 HTTPS 加密传输
   - 配置 CORS 白名单
   - 实施身份认证

2. **速率限制**
   - 限制单个 IP 的连接数
   - 限制推送频率
   - 防止 DDoS 攻击

3. **数据验证**
   - 所有参数必须验证
   - 防止 SQL 注入
   - 过滤 XSS 攻击

---

## 故障排查

### 连接立即断开
- 检查服务器是否支持 SSE
- 确认防火墙允许长连接
- 检查代理服务器配置

### 数据不更新
- 确认数据库有最新数据
- 检查推送间隔配置
- 查看服务器日志

### 重连失败
- 检查网络连接
- 确认服务器运行状态
- 查看浏览器控制台错误

---

## 技术支持

如有问题或建议，请联系开发团队。
