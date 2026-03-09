const authService = require('../services/auth.service');

class AuthController {
  async register(req, res) {
    const { username, password, real_name, phone, dept_id } = req.body;

    try {
      const validationErrors = await authService.validateRegisterData({
        username,
        password,
        real_name,
        phone
      });

      if (validationErrors.length > 0) {
        return res.status(400).json({
          success: false,
          message: '输入验证失败',
          errors: validationErrors
        });
      }

      const userExists = await authService.checkUserExists(username, phone);
      if (userExists.exists) {
        return res.status(409).json({
          success: false,
          message: userExists.message,
          field: userExists.field
        });
      }

      const hashedPassword = await authService.hashPassword(password);

      const userId = await authService.createUser({
        username,
        password: hashedPassword,
        real_name,
        phone,
        dept_id
      });

      console.log(`用户注册成功：${username}, ID: ${userId}`);

      res.status(201).json({
        success: true,
        message: '注册成功',
        data: {
          user_id: userId,
          username,
          real_name: real_name || null,
          phone: phone || null,
          dept_id: dept_id || null
        }
      });

    } catch (error) {
      console.error('注册失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  async login(req, res) {
    const { identifier, password } = req.body;

    try {
      if (!identifier || !password) {
        return res.status(400).json({
          success: false,
          message: '请输入用户名/邮箱和密码'
        });
      }

      const user = await authService.findUserByUsernameOrEmail(identifier);

      if (!user) {
        return res.status(401).json({
          success: false,
          message: '用户名或密码错误'
        });
      }

      if (user.status !== 1) {
        return res.status(403).json({
          success: false,
          message: '账户已被禁用，请联系管理员'
        });
      }

      const isPasswordValid = await authService.comparePassword(password, user.password);

      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: '用户名或密码错误'
        });
      }

      await authService.updateLastLoginTime(user.user_id);

      const token = authService.generateToken(user);

      console.log(`用户登录成功：${user.username}, ID: ${user.user_id}`);

      res.json({
        success: true,
        message: '登录成功',
        data: {
          user: {
            user_id: user.user_id,
            username: user.username,
            real_name: user.real_name,
            phone: user.phone,
            dept_id: user.dept_id,
            last_login_time: new Date()
          },
          token,
          expires_in: '24h'
        }
      });

    } catch (error) {
      console.error('登录失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  async getProfile(req, res) {
    try {
      const user = req.user;

      res.json({
        success: true,
        data: {
          user_id: user.user_id,
          username: user.username,
          real_name: user.real_name,
          phone: user.phone,
          dept_id: user.dept_id
        }
      });

    } catch (error) {
      console.error('获取用户信息失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}

module.exports = new AuthController();
