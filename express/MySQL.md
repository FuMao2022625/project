# MySQL 安装和配置指南

## 步骤 1：下载 MySQL 安装程序

1. 访问 MySQL 官方网站：https://dev.mysql.com/downloads/installer/
2. 下载适用于 Windows 的 MySQL 安装程序（推荐版本：MySQL 8.0）
3. 下载完成后运行安装程序

## 步骤 2：安装 MySQL

1. 启动 MySQL 安装程序
2. 选择 "Full" 安装类型以获取完整功能
3. 点击 "Next" 继续
4. 等待安装程序下载并安装所有组件
5. 当系统提示时，将 root 密码设置为 `12305`
6. 其他配置选项保持默认设置
7. 完成安装过程

## 步骤 3：配置 MySQL 数据库

1. 打开 MySQL 命令行客户端
2. 输入 root 密码（`12305`）
3. 运行以下命令创建和配置数据库：

```sql
-- 使用正确的字符集和校对规则创建数据库
CREATE DATABASE intelligent_inspection_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 验证数据库是否创建成功
SHOW DATABASES;

-- 检查字符集和校对规则
SELECT schema_name, default_character_set_name, default_collation_name FROM information_schema.schemata WHERE schema_name = 'intelligent_inspection_system';

-- 验证 root 用户权限
SHOW GRANTS FOR 'root'@'localhost';
```

## 步骤 4：测试连接

1. 要测试连接，请运行以下命令：

```sql
-- 连接到数据库
USE intelligent_inspection_system;

-- 创建测试表
CREATE TABLE test_table (id INT PRIMARY KEY AUTO_INCREMENT, name VARCHAR(255));

-- 插入测试记录
INSERT INTO test_table (name) VALUES ('Test');

-- 查询测试记录
SELECT * FROM test_table;

-- 删除测试表
DROP TABLE test_table;
```

## 步骤 5：配置环境变量（可选）

1. 将 MySQL bin 目录添加到系统 PATH 中以便于访问
2. 通常位于：`C:\Program Files\MySQL\MySQL Server 8.0\bin`

## 步骤 6：从 Node.js 连接（可选）

要从 Express 应用程序连接到此 MySQL 数据库，您需要安装 MySQL 驱动程序：

```bash
npm install mysql2
```

然后在应用程序中添加连接配置：

```javascript
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '12305',
  database: 'intelligent_inspection_system',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// 测试连接
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('Connected to MySQL database');
    connection.release();
  } catch (error) {
    console.error('Error connecting to MySQL:', error);
  }
}

testConnection();
```