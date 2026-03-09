# Express Promax 项目 API 文档

## 1. 项目概述

Express Promax 是一个基于 Express.js 构建的嵌入式设备数据接收和管理系统，提供了完整的API接口体系，支持用户认证、实时数据传输、数据导出等功能。

## 2. API 接口列表

### 2.1 认证相关接口

| 接口名称 | HTTP方法 | 完整URL路径 | 功能描述 | 认证方式 |
|---------|---------|-----------|---------|--------|
| 用户注册 | POST | /auth/register | 注册新用户，返回用户信息和JWT令牌 | 无需认证 |
| 用户登录 | POST | /auth/login | 用户登录，返回用户信息和JWT令牌 | 无需认证 |
| 账号注销 | POST | /auth/delete-account | 注销用户账号，需要验证身份 | JWT认证 |
| 恢复账号 | POST | /auth/recover-account | 恢复处于注销后悔期的账号 | JWT认证 |

#### 2.1.1 用户注册接口

**请求参数：**
| 参数名称 | 类型 | 是否必填 | 描述 |
|---------|------|---------|------|
| username | string | 是 | 用户名，长度3-50个字符 |
| email | string | 是 | 邮箱地址，必须是有效的邮箱格式 |
| password | string | 是 | 密码，长度至少6位 |

**响应数据结构：**
| 字段名称 | 类型 | 描述 |
|---------|------|------|
| success | boolean | 请求是否成功 |
| message | string | 响应消息 |
| data | object | 用户信息和令牌 |
| data.id | number | 用户ID |
| data.username | string | 用户名 |
| data.email | string | 邮箱地址 |
| data.token | string | JWT令牌 |

**状态码：**
- 201: 注册成功
- 400: 数据验证失败或用户名/邮箱已存在
- 500: 服务器内部错误

**请求示例：**
```json
POST /auth/register
Content-Type: application/json

{
  "username": "testuser",
  "email": "test@example.com",
  "password": "password123"
}
```

**响应示例：**
```json
{
  "success": true,
  "message": "注册成功",
  "data": {
    "id": 1,
    "username": "testuser",
    "email": "test@example.com",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### 2.1.2 用户登录接口

**请求参数：**
| 参数名称 | 类型 | 是否必填 | 描述 |
|---------|------|---------|------|
| identifier | string | 否 | 用户名或邮箱（二选一） |
| username | string | 否 | 用户名（二选一，与identifier功能相同） |
| password | string | 是 | 密码 |

**响应数据结构：**
| 字段名称 | 类型 | 描述 |
|---------|------|------|
| success | boolean | 请求是否成功 |
| message | string | 响应消息 |
| data | object | 用户信息和令牌 |
| data.id | number | 用户ID |
| data.username | string | 用户名 |
| data.email | string | 邮箱地址 |
| data.token | string | JWT令牌 |

**状态码：**
- 200: 登录成功
- 400: 数据验证失败
- 401: 用户名/邮箱或密码错误
- 500: 服务器内部错误

**请求示例：**
```json
POST /auth/login
Content-Type: application/json

{
  "identifier": "testuser",
  "password": "password123"
}
```

**响应示例：**
```json
{
  "success": true,
  "message": "登录成功",
  "data": {
    "id": 1,
    "username": "testuser",
    "email": "test@example.com",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### 2.1.3 账号注销接口

**请求参数：**
| 参数名称 | 类型 | 是否必填 | 描述 |
|---------|------|---------|------|
| password | string | 是 | 用户密码，用于验证身份 |

**响应数据结构：**
| 字段名称 | 类型 | 描述 |
|---------|------|------|
| success | boolean | 请求是否成功 |
| message | string | 响应消息 |
| data | object | 注销相关信息 |
| data.deactivation_date | string | 注销日期 |
| data.recovery_period | string | 恢复期限 |
| data.recovery_instructions | string | 恢复账号说明 |

**状态码：**
- 200: 注销请求提交成功
- 400: 数据验证失败
- 401: 身份验证失败
- 403: 账号状态异常
- 500: 服务器内部错误

**请求示例：**
```json
POST /auth/delete-account
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

{
  "password": "password123"
}
```

**响应示例：**
```json
{
  "success": true,
  "message": "账号注销请求已提交，我们已发送确认邮件到您的邮箱。您有7天时间可以恢复账号。",
  "data": {
    "deactivation_date": "2026-03-08T12:00:00.000Z",
    "recovery_period": "7天",
    "recovery_instructions": "如果您想恢复账号，请在7天内使用原账号登录并按照提示操作。"
  }
}
```

#### 2.1.4 恢复账号接口

**请求参数：** 无

**响应数据结构：**
| 字段名称 | 类型 | 描述 |
|---------|------|------|
| success | boolean | 请求是否成功 |
| message | string | 响应消息 |
| data | object | 恢复相关信息 |
| data.recovery_date | string | 恢复日期 |
| data.status | string | 账号状态 |

**状态码：**
- 200: 账号恢复成功
- 401: 身份验证失败
- 403: 账号状态异常或已过后悔期
- 500: 服务器内部错误

**请求示例：**
```json
POST /auth/recover-account
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**响应示例：**
```json
{
  "success": true,
  "message": "账号恢复成功",
  "data": {
    "recovery_date": "2026-03-08T12:00:00.000Z",
    "status": "active"
  }
}
```

### 2.2 温度数据接口

| 接口名称 | HTTP方法 | 完整URL路径 | 功能描述 | 认证方式 |
|---------|---------|-----------|---------|--------|
| SSE温度数据流 | GET | /temperature/stream | 提供实时温度数据的SSE流 | 无需认证 |

#### 2.2.1 SSE温度数据流接口

**请求参数：** 无

**响应数据结构：**
- 类型：EventStream
- 事件类型：
  - temperature: 温度数据事件
  - heartbeat: 心跳事件

**温度数据事件格式：**
```
event: temperature
data: {"temperature": "25.5", "timestamp": "2026-03-08T12:00:00.000Z"}

```

**心跳事件格式：**
```
event: heartbeat
data: 2026-03-08T12:00:00.000Z

```

**状态码：** 无（SSE连接保持开放）

**请求示例：**
```
GET /temperature/stream
Accept: text/event-stream
```

### 2.3 热成像数据接口

| 接口名称 | HTTP方法 | 完整URL路径 | 功能描述 | 认证方式 |
|---------|---------|-----------|---------|--------|
| SSE热成像数据流 | GET | /thermal/stream | 提供实时热成像数据的SSE流 | 无需认证 |
| 获取热成像历史数据 | GET | /thermal/history | 获取热成像历史数据 | 无需认证 |

#### 2.3.1 SSE热成像数据流接口

**请求参数：** 无

**响应数据结构：**
- 类型：EventStream
- 事件类型：
  - thermal_data: 热成像数据事件
  - heartbeat: 心跳事件

**热成像数据事件格式：**
```
event: thermal_data
data: [{"x": 0, "y": 0, "temperature": "25.5"}, ...]

```

**心跳事件格式：**
```
event: heartbeat
data: {"timestamp": "2026-03-08T12:00:00.000Z"}

```

**状态码：** 无（SSE连接保持开放）

**请求示例：**
```
GET /thermal/stream
Accept: text/event-stream
```

#### 2.3.2 获取热成像历史数据接口

**请求参数：**
| 参数名称 | 类型 | 是否必填 | 描述 |
|---------|------|---------|------|
| limit | number | 否 | 限制返回数量（默认10） |

**响应数据结构：**
| 字段名称 | 类型 | 描述 |
|---------|------|------|
| success | boolean | 请求是否成功 |
| data | array | 热成像历史数据列表 |

**状态码：**
- 200: 获取成功
- 500: 获取失败

**请求示例：**
```
GET /thermal/history?limit=5
```

**响应示例：**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "device_id": "DEVICE-12345678",
      "temperature_data": "[{\"x\": 0, \"y\": 0, \"temperature\": \"25.5\"}, ...]",
      "captured_at": "2026-03-08T12:00:00.000Z",
      "created_at": "2026-03-08T12:00:00.000Z"
    },
    ...
  ]
}
```

### 2.4 数据导出接口

| 接口名称 | HTTP方法 | 完整URL路径 | 功能描述 | 认证方式 |
|---------|---------|-----------|---------|--------|
| 导出数据 | POST | /export/data | 导出数据为CSV或Excel格式 | 无需认证 |
| 获取支持的表列表 | GET | /export/tables | 获取可导出的表列表 | 无需认证 |

#### 2.4.1 导出数据接口

**请求参数：**
| 参数名称 | 类型 | 是否必填 | 描述 |
|---------|------|---------|------|
| table | string | 是 | 表名（支持：users, robots, environments, thermal_images） |
| format | string | 是 | 导出格式（csv或xlsx） |
| filters | object | 否 | 过滤条件（可选字段：startDate, endDate, status） |

**响应数据结构：**
| 字段名称 | 类型 | 描述 |
|---------|------|------|
| success | boolean | 请求是否成功 |
| data | object | 导出文件信息 |
| data.fileName | string | 文件名 |
| data.recordCount | number | 记录数 |
| data.downloadUrl | string | 下载链接 |

**状态码：**
- 200: 导出成功
- 400: 参数错误
- 500: 导出失败

**请求示例：**
```json
POST /export/data
Content-Type: application/json

{
  "table": "users",
  "format": "csv",
  "filters": {
    "startDate": "2026-01-01",
    "endDate": "2026-03-08"
  }
}
```

**响应示例：**
```json
{
  "success": true,
  "data": {
    "fileName": "users_2026-03-08T12-00-00-000Z.csv",
    "recordCount": 10,
    "downloadUrl": "/exports/users_2026-03-08T12-00-00-000Z.csv"
  }
}
```

#### 2.4.2 获取支持的表列表接口

**请求参数：** 无

**响应数据结构：**
| 字段名称 | 类型 | 描述 |
|---------|------|------|
| success | boolean | 请求是否成功 |
| data | array | 支持的表列表 |

**状态码：**
- 200: 获取成功

**请求示例：**
```
GET /export/tables
```

**响应示例：**
```json
{
  "success": true,
  "data": ["users", "robots", "environments", "thermal_images"]
}
```

### 2.5 视频流接口

| 接口名称 | HTTP方法 | 完整URL路径 | 功能描述 | 认证方式 |
|---------|---------|-----------|---------|--------|
| 视频流页面 | GET | /video/stream | 提供视频流页面访问 | 无需认证 |

#### 2.5.1 视频流页面接口

**请求参数：** 无

**响应数据结构：**
- 类型：HTML文件
- 内容：video.html页面

**状态码：**
- 200: 访问成功

**请求示例：**
```
GET /video/stream
```

## 3. 接口依赖关系和调用流程

### 3.1 认证流程

1. **用户注册** → **用户登录** → **获取JWT令牌** → **使用令牌访问需要认证的接口**
2. **账号注销** → **账号恢复**（在7天后悔期内）

### 3.2 数据流程

1. **数据传输** → **数据存储** → **数据查询/导出**
2. **实时数据订阅**（SSE）→ **数据展示**

### 3.3 导出流程

1. **获取支持的表列表** → **选择表和格式** → **执行导出** → **下载文件**

## 4. 认证方式和权限要求

### 4.1 认证方式

- **JWT认证**：使用JSON Web Token进行身份验证，在请求头中添加 `Authorization: Bearer <token>`
- **无认证**：大部分接口不需要认证，包括：
  - 登录和注册接口
  - 实时数据流接口（SSE）
  - 数据查询和导出接口

### 4.2 权限要求

| 接口 | 权限要求 |
|------|----------|
| 用户注册 | 无 |
| 用户登录 | 无 |
| 账号注销 | 需要有效的JWT令牌和密码验证 |
| 恢复账号 | 需要有效的JWT令牌 |
| 其他接口 | 无 |

### 4.3 限流策略

- **API请求**：目前未实现限流，建议在生产环境中添加限流中间件

## 5. 技术栈

- **后端框架**：Express.js
- **数据库**：MySQL
- **认证**：JWT
- **实时数据**：Server-Sent Events (SSE)
- **数据导出**：csv-writer, xlsx

## 6. 部署说明

1. **环境变量**：可通过环境变量配置数据库连接等参数
2. **数据库**：需要先初始化数据库，系统会自动创建所需表结构
3. **静态文件**：导出的文件存储在public/exports目录
4. **日志**：错误日志存储在logs目录

## 7. 总结

Express Promax 项目提供了完整的API接口体系，支持用户认证、实时数据传输、数据存储和导出等功能。所有接口都遵循RESTful设计原则，返回统一的JSON格式响应（除SSE接口外）。

该系统设计灵活，可扩展性强，适用于各种嵌入式设备数据采集和管理场景。通过SSE技术，实现了高效的实时数据传输，为前端应用提供了流畅的数据展示体验。