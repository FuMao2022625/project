# Express.js 用户认证系统

## 项目概述

这是一个基于Express.js的完整用户认证系统，包含注册和登录功能，支持JWT令牌认证。

## 技术栈

- Node.js
- Express.js
- MySQL
- bcryptjs (密码哈希)
- jsonwebtoken (JWT令牌)
- express-validator (表单验证)
- helmet (安全防护)

## 目录结构

```
express/
├── config/
│   ├── db.js          # 数据库连接配置
│   └── init_db.js     # 数据库初始化脚本
├── controllers/
│   ├── authController.js  # 认证控制器
│   └── homeController.js  # 主页控制器
├── middleware/
│   └── auth.js        # JWT令牌验证中间件
├── models/
│   └── user.js        # 用户数据模型
├── routes/
│   ├── auth.js        # 认证路由
│   └── index.js       # 主页路由
├── test/
│   └── auth.test.js   # 认证功能测试
├── app.js             # 主入口文件
├── package.json       # 项目配置文件
└── README.md          # 项目文档
```

## API接口文档

### 1. 注册接口

**请求地址**: `/api/auth/register`

**请求方法**: POST

**请求体**:

```json
{
  "username": "testuser",
  "email": "test@example.com",
  "password": "Test@1234"
}
```

**请求参数验证**:
- `username`: 6-20个字符，只能包含字母、数字和下划线，且必须唯一
- `email`: 有效的电子邮箱格式，且必须唯一
- `password`: 至少8位，包含大小写字母、数字和特殊符号

**成功响应**:

```json
{
  "message": "注册成功"
}
```

**失败响应**:

```json
{
  "errors": [
    {
      "msg": "用户名已存在"
    }
  ]
}
```

### 2. 登录接口

**请求地址**: `/api/auth/login`

**请求方法**: POST

**请求体**:

```json
{
  "email": "test@example.com",
  "password": "Test@1234"
}
```

**请求参数验证**:
- `email`: 有效的电子邮箱格式
- `password`: 不能为空

**成功响应**:

```json
{
  "message": "登录成功",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**失败响应**:

```json
{
  "error": "电子邮箱或密码错误"
}
```

### 3. 验证接口

**请求地址**: `/api/auth/verify`

**请求方法**: GET

**请求头**:
- `Authorization: Bearer <token>`

**成功响应**:

```json
{
  "message": "验证成功",
  "user": {
    "userId": 1,
    "email": "test@example.com"
  }
}
```

**失败响应**:

```json
{
  "error": "无效的认证令牌"
}
```

## 数据库设计

### users表

| 字段名 | 数据类型 | 约束 | 描述 |
| --- | --- | --- | --- |
| id | INT | AUTO_INCREMENT PRIMARY KEY | 用户ID |
| username | VARCHAR(20) | NOT NULL UNIQUE | 用户名 |
| email | VARCHAR(255) | NOT NULL UNIQUE | 电子邮箱 |
| password | VARCHAR(255) | NOT NULL | 哈希后的密码 |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | 更新时间 |

## 安全措施

1. **密码哈希存储**: 使用bcryptjs对密码进行哈希处理，确保密码安全存储
2. **JWT令牌认证**: 使用jsonwebtoken生成和验证令牌，实现无状态认证
3. **防SQL注入**: 使用参数化查询，避免SQL注入攻击
4. **防XSS攻击**: 使用helmet中间件，增强应用的安全性
5. **表单验证**: 使用express-validator对请求数据进行验证，确保数据的合法性

## 启动项目

1. 安装依赖:
   ```bash
   npm install
   ```

2. 初始化数据库:
   ```bash
   node config/init_db.js
   ```

3. 启动服务器:
   ```bash
   npm start
   ```

4. 运行测试:
   ```bash
   npm test
   ```

## 注意事项

- 实际应用中应使用环境变量存储JWT密钥，而不是硬编码在代码中
- 应定期更新JWT密钥，以增强安全性
- 应设置合理的令牌过期时间，平衡安全性和用户体验
- 应实现令牌刷新机制，避免用户频繁登录
- 应添加更多的安全措施，如速率限制、验证码等，防止暴力破解