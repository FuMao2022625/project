const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '24h';
const SALT_ROUNDS = 10;

class AuthService {
  async hashPassword(password) {
    return await bcrypt.hash(password, SALT_ROUNDS);
  }

  async comparePassword(password, hashedPassword) {
    return await bcrypt.compare(password, hashedPassword);
  }

  generateToken(user) {
    const payload = {
      user_id: user.user_id,
      username: user.username,
      real_name: user.real_name,
      dept_id: user.dept_id
    };

    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  }

  verifyToken(token) {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return null;
    }
  }

  async findUserByUsernameOrEmail(identifier) {
    const sql = `
      SELECT user_id, username, password, real_name, phone, dept_id, status, 
             create_time, last_login_time
      FROM sys_user
      WHERE username = ? OR (phone = ? AND ? LIKE '%@%')
    `;
    
    const [rows] = await pool.query(sql, [identifier, identifier, identifier]);
    return rows[0] || null;
  }

  async findUserByUsername(username) {
    const sql = `
      SELECT user_id, username, password, real_name, phone, dept_id, status,
             create_time, last_login_time
      FROM sys_user
      WHERE username = ?
    `;
    
    const [rows] = await pool.query(sql, [username]);
    return rows[0] || null;
  }

  async findUserByPhone(phone) {
    const sql = `
      SELECT user_id, username, password, real_name, phone, dept_id, status,
             create_time, last_login_time
      FROM sys_user
      WHERE phone = ?
    `;
    
    const [rows] = await pool.query(sql, [phone]);
    return rows[0] || null;
  }

  async createUser(userData) {
    const sql = `
      INSERT INTO sys_user (username, password, real_name, phone, dept_id, status)
      VALUES (?, ?, ?, ?, ?, 1)
    `;
    
    const [result] = await pool.query(sql, [
      userData.username,
      userData.password,
      userData.real_name || null,
      userData.phone || null,
      userData.dept_id || null
    ]);
    
    return result.insertId;
  }

  async updateLastLoginTime(userId) {
    const sql = `UPDATE sys_user SET last_login_time = NOW() WHERE user_id = ?`;
    await pool.query(sql, [userId]);
  }

  async validateRegisterData(data) {
    const errors = [];

    if (!data.username || data.username.trim().length < 3) {
      errors.push('用户名至少需要 3 个字符');
    } else if (data.username.length > 50) {
      errors.push('用户名不能超过 50 个字符');
    } else if (!/^[a-zA-Z0-9_]+$/.test(data.username)) {
      errors.push('用户名只能包含字母、数字和下划线');
    }

    if (!data.password || data.password.length < 6) {
      errors.push('密码至少需要 6 个字符');
    } else if (data.password.length > 100) {
      errors.push('密码不能超过 100 个字符');
    }

    if (data.phone) {
      const phoneRegex = /^1[3-9]\d{9}$/;
      if (!phoneRegex.test(data.phone)) {
        errors.push('请输入有效的手机号码');
      }
    }

    if (data.real_name && data.real_name.length > 50) {
      errors.push('真实姓名不能超过 50 个字符');
    }

    return errors;
  }

  async checkUserExists(username, phone) {
    const sql = `SELECT user_id, username, phone FROM sys_user WHERE username = ? OR phone = ?`;
    const [rows] = await pool.query(sql, [username, phone]);
    
    if (rows.length > 0) {
      const existingUser = rows[0];
      if (existingUser.username === username) {
        return { exists: true, field: 'username', message: '用户名已存在' };
      }
      if (existingUser.phone === phone) {
        return { exists: true, field: 'phone', message: '手机号已被注册' };
      }
    }
    
    return { exists: false };
  }
}

module.exports = new AuthService();
