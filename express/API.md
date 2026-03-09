# 认证 API 文档

## 概述

本文档描述了用户认证系统的 RESTful API 接口，包括用户注册、登录和信息查询功能。

## 基础信息

- **基础 URL**: `http://localhost:3000/api/auth`
- **数据格式**: JSON
- **字符编码**: UTF-8

---

## API 接口

### 1. 用户注册

**接口**: `POST /api/auth/register`

**描述**: 创建新用户账户

**请求参数**:

| 参数 | 类型 | 必填 | 说明 | 验证规则 |
|------|------|------|------|----------|
| username | string | 是 | 用户名 | 3-50 字符，只能包含字母、数字和下划线 |
| password | string | 是 | 密码 | 至少 6 个字符，最多 100 个字符 |
| real_name | string | 否 | 真实姓名 | 最多 50 个字符 |
| phone | string | 否 | 手机号 | 中国大陆 11 位手机号（1 开头） |
| dept_id | number | 否 | 部门 ID | 正整数 |

**请求示例**:
```json
{
  "username": "zhangsan",
  "password": "password123",
  "real_name": "张三",
  "phone": "13800138000",
  "dept_id": 1
}
```

**成功响应** (201):
```json
{
  "success": true,
  "message": "注册成功",
  "data": {
    "user_id": 201,
    "username": "zhangsan",
    "real_name": "张三",
    "phone": "13800138000",
    "dept_id": 1
  }
}
```

**失败响应**:

400 - 验证失败:
```json
{
  "success": false,
  "message": "输入验证失败",
  "errors": ["用户名至少需要 3 个字符", "密码至少需要 6 个字符"]
}
```

409 - 用户已存在:
```json
{
  "success": false,
  "message": "用户名已存在",
  "field": "username"
}
```

---

### 2. 用户登录

**接口**: `POST /api/auth/login`

**描述**: 使用用户名/邮箱和密码进行身份验证

**请求参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| identifier | string | 是 | 用户名或邮箱 |
| password | string | 是 | 密码 |

**请求示例**:
```json
{
  "identifier": "zhangsan",
  "password": "password123"
}
```

**成功响应** (200):
```json
{
  "success": true,
  "message": "登录成功",
  "data": {
    "user": {
      "user_id": 201,
      "username": "zhangsan",
      "real_name": "张三",
      "phone": "13800138000",
      "dept_id": 1,
      "last_login_time": "2026-03-09T15:30:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires_in": "24h"
  }
}
```

**失败响应**:

400 - 请求参数错误:
```json
{
  "success": false,
  "message": "请输入用户名/邮箱和密码"
}
```

401 - 认证失败:
```json
{
  "success": false,
  "message": "用户名或密码错误"
}
```

403 - 账户被禁用:
```json
{
  "success": false,
  "message": "账户已被禁用，请联系管理员"
}
```

---

### 3. 获取用户信息

**接口**: `GET /api/auth/profile`

**描述**: 获取当前登录用户的详细信息

**请求头**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| Authorization | string | 是 | Bearer {JWT 令牌} |

**请求示例**:
```bash
GET /api/auth/profile
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**成功响应** (200):
```json
{
  "success": true,
  "data": {
    "user_id": 201,
    "username": "zhangsan",
    "real_name": "张三",
    "phone": "13800138000",
    "dept_id": 1
  }
}
```

**失败响应**:

401 - 未授权:
```json
{
  "success": false,
  "message": "未提供认证令牌"
}
```

401 - 令牌无效:
```json
{
  "success": false,
  "message": "令牌无效或已过期"
}
```

403 - 账户被禁用:
```json
{
  "success": false,
  "message": "账户已被禁用"
}
```

---

## 安全说明

### 密码安全
- 所有密码使用 bcrypt 算法进行加密存储
- 加密强度：10 轮盐值
- 密码不会在任何响应中返回

### JWT 令牌
- 令牌有效期：24 小时
- 令牌包含用户基本信息（user_id, username, real_name, dept_id）
- 令牌过期后需要重新登录获取新令牌
- 建议在生产环境中使用环境变量设置 JWT_SECRET

### 输入验证
- 所有输入都经过严格验证
- 防止 SQL 注入攻击
- 防止 XSS 攻击

---

## 错误处理

所有错误响应都遵循统一的格式：

```json
{
  "success": false,
  "message": "错误描述信息",
  "errors": ["具体错误列表"],
  "field": "出错的字段名"
}
```

### HTTP 状态码说明

| 状态码 | 说明 |
|--------|------|
| 200 | 请求成功 |
| 201 | 创建成功 |
| 400 | 请求参数错误 |
| 401 | 未授权/认证失败 |
| 403 | 禁止访问/账户被禁用 |
| 404 | 资源不存在 |
| 409 | 资源冲突（如重复注册） |
| 500 | 服务器内部错误 |

---

## 使用示例

### Node.js (axios)

```javascript
const axios = require('axios');

const API_BASE = 'http://localhost:3000/api/auth';

// 注册
async function register(username, password) {
  const response = await axios.post(`${API_BASE}/register`, {
    username,
    password,
    real_name: '张三',
    phone: '13800138000'
  });
  return response.data;
}

// 登录
async function login(identifier, password) {
  const response = await axios.post(`${API_BASE}/login`, {
    identifier,
    password
  });
  return response.data;
}

// 获取用户信息
async function getProfile(token) {
  const response = await axios.get(`${API_BASE}/profile`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return response.data;
}

// 使用示例
(async () => {
  try {
    // 注册新用户
    await register('testuser', 'password123');
    
    // 登录获取令牌
    const loginResult = await login('testuser', 'password123');
    const token = loginResult.data.token;
    
    // 使用令牌获取用户信息
    const profile = await getProfile(token);
    console.log('用户信息:', profile);
  } catch (error) {
    console.error('错误:', error.response?.data);
  }
})();
```

### cURL

```bash
# 注册
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "password123",
    "real_name": "测试用户",
    "phone": "13800138000"
  }'

# 登录
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "testuser",
    "password": "password123"
  }'

# 获取用户信息
curl -X GET http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 运行测试

项目包含完整的自动化测试脚本：

```bash
# 启动服务器
npm start

# 在另一个终端运行测试
node test-auth-api.js
```

测试将验证：
- ✓ 新用户注册
- ✓ 用户登录
- ✓ JWT 令牌验证
- ✓ 获取用户信息
- ✓ 重复注册检测
- ✓ 错误密码处理
- ✓ 输入验证
- ✓ 令牌过期处理

---

## 配置说明

### 环境变量

可以通过环境变量配置认证系统：

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| JWT_SECRET | JWT 签名密钥 | your-secret-key-change-in-production |
| NODE_ENV | 运行环境 | development |

### 生产环境建议

1. **修改 JWT_SECRET**: 使用强随机字符串
2. **启用 HTTPS**: 保护传输中的敏感信息
3. **设置令牌过期时间**: 根据安全需求调整
4. **实现令牌刷新机制**: 避免频繁重新登录
5. **添加速率限制**: 防止暴力破解
6. **启用日志记录**: 监控异常登录尝试

---

## 数据库表结构

用户信息存储在 `sys_user` 表中：

```sql
CREATE TABLE sys_user (
  user_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(100) NOT NULL,
  real_name VARCHAR(50),
  phone VARCHAR(20),
  dept_id BIGINT UNSIGNED,
  status TINYINT DEFAULT 1,
  create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_login_time DATETIME
);
```

---

## 联系支持

如有问题或建议，请联系开发团队。
