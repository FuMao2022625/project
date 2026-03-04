<template>
  <div class="login-container has-bg-image">
    <div class="login-form-wrapper">
      <div class="login-form card">
        <div class="form-header">
          <div class="logo-section">
            <div class="logo-circle">
              <i class="logo-icon">🔒</i>
            </div>
            <h2 class="welcome-text">{{ isRegistering ? (registerType === 'user' ? '用户注册' : '手机号注册') : '欢迎回来' }}</h2>
            <p class="subtitle">{{ isRegistering ? (registerType === 'user' ? '请输入您的注册信息以创建账户' : '请输入手机号及相关信息完成注册') : '请输入您的账户信息以登录系统' }}</p>
          </div>
        </div>

        <div class="form-body">
          <div class="tabs" v-if="!isRegistering">
            <button 
              :class="['tab-btn', { active: loginType === 'account' }]" 
              @click="switchToAccountLogin"
            >
              账户登录
            </button>
            <button 
              :class="['tab-btn', { active: loginType === 'phone' }]" 
              @click="switchToPhoneLogin"
            >
              手机登录
            </button>
          </div>

          <!-- 注册类型选择 -->
          <div class="tabs" v-if="isRegistering">
            <button 
              :class="['tab-btn', { active: registerType === 'user' }]" 
              @click="switchToUserRegister"
            >
              用户注册
            </button>
            <button 
              :class="['tab-btn', { active: registerType === 'phone' }]" 
              @click="switchToPhoneRegister"
            >
              手机注册
            </button>
          </div>

          <!-- 用户注册表单 -->
          <form v-if="isRegistering && registerType === 'user'" class="login-form-content">
            <div class="input-group">
              <label>用户名</label>
              <input 
                type="text" 
                class="input-field" 
                placeholder="请输入用户名"
                v-model="userRegisterForm.username"
              />
            </div>

            <div class="input-group">
              <label>邮箱</label>
              <input 
                type="email" 
                class="input-field" 
                placeholder="请输入邮箱"
                v-model="userRegisterForm.email"
              />
            </div>

            <div class="input-group">
              <label>验证码</label>
              <div class="verification-input">
                <input 
                  type="text" 
                  class="input-field" 
                  placeholder="请输入验证码"
                  v-model="userRegisterForm.code"
                />
                <div class="captcha-wrapper">
                  <canvas ref="userRegisterCaptchaCanvas" class="captcha-canvas" @click="refreshUserRegisterCaptcha"></canvas>
                  <span class="captcha-refresh" @click="refreshUserRegisterCaptcha">换一张</span>
                </div>
              </div>
            </div>

            <div class="input-group">
              <label>密码</label>
              <input 
                type="password" 
                class="input-field" 
                placeholder="请输入密码"
                v-model="userRegisterForm.password"
              />
            </div>

            <div class="input-group">
              <label>确认密码</label>
              <input 
                type="password" 
                class="input-field" 
                placeholder="请再次输入密码"
                v-model="userRegisterForm.confirmPassword"
              />
            </div>

            <button type="button" class="btn login-btn" @click="handleUserRegister">
              注册
            </button>
          </form>

          <!-- 手机注册表单 -->
          <form v-if="isRegistering && registerType === 'phone'" class="login-form-content">
            <div class="input-group">
              <label>手机号</label>
              <input 
                type="text" 
                class="input-field" 
                placeholder="请输入手机号"
                v-model="phoneRegisterForm.phone"
              />
            </div>

            <div class="input-group">
              <label>邮箱</label>
              <input 
                type="email" 
                class="input-field" 
                placeholder="请输入邮箱（选填）"
                v-model="phoneRegisterForm.email"
              />
            </div>

            <div class="input-group">
              <label>验证码</label>
              <div class="verification-input">
                <input 
                  type="text" 
                  class="input-field" 
                  placeholder="请输入验证码"
                  v-model="phoneRegisterForm.code"
                />
                <div class="captcha-wrapper">
                  <canvas ref="phoneRegisterCaptchaCanvas" class="captcha-canvas" @click="refreshPhoneRegisterCaptcha"></canvas>
                  <span class="captcha-refresh" @click="refreshPhoneRegisterCaptcha">换一张</span>
                </div>
              </div>
            </div>

            <div class="input-group">
              <label>密码</label>
              <input 
                type="password" 
                class="input-field" 
                placeholder="请输入密码"
                v-model="phoneRegisterForm.password"
              />
            </div>

            <div class="input-group">
              <label>确认密码</label>
              <input 
                type="password" 
                class="input-field" 
                placeholder="请再次输入密码"
                v-model="phoneRegisterForm.confirmPassword"
              />
            </div>

            <button type="button" class="btn login-btn" @click="handlePhoneRegister">
              注册
            </button>
          </form>

          <!-- 账户登录表单 -->
          <form v-if="!isRegistering && loginType === 'account'" class="login-form-content">
            <div class="input-group">
              <label>用户名</label>
              <input 
                type="text" 
                class="input-field" 
                placeholder="请输入用户名"
                v-model="accountForm.username"
              />
            </div>

            <div class="input-group">
              <label>密码</label>
              <input 
                type="password" 
                class="input-field" 
                placeholder="请输入密码"
                v-model="accountForm.password"
              />
            </div>
            
            <div class="input-group">
              <label>验证码</label>
              <div class="verification-input">
                <input 
                  type="text" 
                  class="input-field" 
                  placeholder="请输入验证码"
                  v-model="accountForm.captcha"
                />
                <div class="captcha-wrapper">
                  <canvas ref="accountLoginCaptchaCanvas" class="captcha-canvas" @click="refreshAccountLoginCaptcha"></canvas>
                  <span class="captcha-refresh" @click="refreshAccountLoginCaptcha">换一张</span>
                </div>
              </div>
            </div>

            <div class="form-options">
              <label class="checkbox-label">
                <input type="checkbox" v-model="accountForm.remember" />
                <span class="checkmark"></span>
                记住我
              </label>
              <a href="#" class="forgot-password">忘记密码?</a>
            </div>

            <button type="button" class="btn login-btn" @click="handleAccountLogin">
              登录
            </button>
          </form>

          <!-- 手机登录表单 -->
          <form v-if="!isRegistering && loginType === 'phone'" class="login-form-content">
            <div class="input-group">
              <label>手机号</label>
              <input 
                type="text" 
                class="input-field" 
                placeholder="请输入手机号"
                v-model="phoneForm.phone"
              />
            </div>

            <div class="input-group">
              <label>验证码</label>
              <div class="verification-input">
                <input 
                  type="text" 
                  class="input-field" 
                  placeholder="请输入验证码"
                  v-model="phoneForm.code"
                />
                <div class="captcha-wrapper">
                  <canvas ref="phoneLoginCaptchaCanvas" class="captcha-canvas" @click="refreshPhoneLoginCaptcha"></canvas>
                  <span class="captcha-refresh" @click="refreshPhoneLoginCaptcha">换一张</span>
                </div>
              </div>
            </div>

            <button type="button" class="btn login-btn" @click="handlePhoneLogin">
              登录
            </button>
          </form>
        </div>

        <div class="form-footer">
          <p>{{ isRegistering ? '已有账户？' : '还没有账户？'}}  
            <a href="#" class="toggle-link" @click.prevent="toggleAuthType">
               {{ isRegistering ? '立即登录' : '立即注册' }}
            </a>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick } from 'vue';
import { useRouter, useRoute } from 'vue-router';

const router = useRouter();
const route = useRoute();
const loginType = ref('account');
const isRegistering = ref(false);
const registerType = ref('user'); // 'user' 或 'phone'
const loading = ref(false);
const error = ref('');
const regError = ref('');

// 登录相关变量
const loginMethod = ref('account');
const loginId = ref('');
const password = ref('');
const phone = ref('');
const phoneCaptcha = ref('');

// 注册相关变量
const agreeToTerms = ref(false);
const registerMethod = ref('username');
const regUsername = ref('');
const regPhone = ref('');
const regCaptcha = ref('');
const regPassword = ref('');
const confirmPassword = ref('');
const quickRegPhone = ref('');
const quickRegCaptcha = ref('');
const quickRegPassword = ref('');

// 添加各个表单独立的验证码canvas引用
const userRegisterCaptchaCanvas = ref(null);
const phoneRegisterCaptchaCanvas = ref(null);
const accountLoginCaptchaCanvas = ref(null);
const phoneLoginCaptchaCanvas = ref(null);

// 更新 accountForm，添加验证码字段
const accountForm = reactive({
  username: '',
  password: '',
  captcha: ''
});

const phoneForm = reactive({
  phone: '',
  code: ''
});

// 用户注册表单
const userRegisterForm = reactive({
  username: '',
  email: '',
  code: '',
  password: '',
  confirmPassword: ''
});

// 手机注册表单
const phoneRegisterForm = reactive({
  phone: '',
  email: '',
  code: '',
  password: '',
  confirmPassword: ''
});

// 添加各个表单独立的验证码数据
const userRegisterCaptchaText = ref('');
const phoneRegisterCaptchaText = ref('');
const accountLoginCaptchaText = ref('');
const phoneLoginCaptchaText = ref('');

// 各表单独立的canvas context
const userRegisterCaptchaCtx = ref(null);
const phoneRegisterCaptchaCtx = ref(null);
const accountLoginCaptchaCtx = ref(null);
const phoneLoginCaptchaCtx = ref(null);

// 切换表单时更新验证码
const switchToAccountLogin = () => {
  loginType.value = 'account';
  nextTick(() => {
    refreshAccountLoginCaptcha();
  });
};

const switchToPhoneLogin = () => {
  loginType.value = 'phone';
  nextTick(() => {
    refreshPhoneLoginCaptcha();
  });
};

const switchToUserRegister = () => {
  registerType.value = 'user';
  nextTick(() => {
    refreshUserRegisterCaptcha();
  });
};

const switchToPhoneRegister = () => {
  registerType.value = 'phone';
  nextTick(() => {
    refreshPhoneRegisterCaptcha();
  });
};

const toggleAuthType = () => {
  isRegistering.value = !isRegistering.value;
  // 如果切换到注册页面，默认选择用户注册
  if (isRegistering.value) {
    registerType.value = 'user';
  }
  // 切换时刷新对应表单的验证码
  nextTick(() => {
    if (isRegistering.value) {
      if (registerType.value === 'user') {
        refreshUserRegisterCaptcha();
      } else {
        refreshPhoneRegisterCaptcha();
      }
    } else {
      if (loginType.value === 'account') {
        refreshAccountLoginCaptcha();
      } else {
        refreshPhoneLoginCaptcha();
      }
    }
  });
};

const handleAccountLogin = async () => {
  if (!accountForm.captcha) {
    alert('请输入验证码');
    return;
  }
  
  if (accountForm.captcha.toLowerCase() !== accountLoginCaptchaText.value.toLowerCase()) {
    alert('验证码错误');
    refreshAccountLoginCaptcha();
    return;
  }
  
  // 验证必须填写用户名
  if (!accountForm.username) {
    alert('请填写用户名');
    return;
  }
  
  // 调用真实 API 登录
  try {
    const credentials = {
      username: accountForm.username,
      password: accountForm.password,
      captcha: accountForm.captcha
    };
    
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(credentials)
    });

    // 打印响应状态以便调试
    console.log('登录请求发送:', credentials);
    console.log('响应状态:', response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      // console.error('服务器返回错误:', errorData);
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.message || '未知错误'}`);
    }

    const result = await response.json();
    
    // 保存真实用户信息
    localStorage.setItem('token', result.token);
    localStorage.setItem('userInfo', JSON.stringify(result.userInfo));
    
    // 跳转到首页
    router.push('/shouye');
  } catch (err) {
    alert('登录失败：' + err.message);
  }
};

const handlePhoneLogin = async () => {
  // 简单验证手机号和验证码
  if (!phoneForm.phone || !phoneForm.code) {
    alert('请输入手机号和验证码');
    return;
  }

  // 调用真实API手机登录
  try {
    const credentials = {
      phone: phoneForm.phone,
      code: phoneForm.code
    };
    
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(credentials)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    // 保存真实用户信息
    localStorage.setItem('token', result.token);
    localStorage.setItem('userInfo', JSON.stringify(result.userInfo));
    
    // 跳转到首页
    router.push('/shouye');
  } catch (err) {
    alert('手机号或验证码错误');
  }
};

const handleUserRegister = async () => {
  // 验证两次密码是否一致
  if (userRegisterForm.password !== userRegisterForm.confirmPassword) {
    alert('两次输入的密码不一致');
    return;
  }
  
  // 验证必填项
  if (!userRegisterForm.username || !userRegisterForm.code || 
      !userRegisterForm.password || !userRegisterForm.confirmPassword) {
    alert('请填写完整信息');
    return;
  }
  
  // 验证用户名格式
  const usernameRegex = /^[a-zA-Z0-9_]{3,16}$/;
  if (!usernameRegex.test(userRegisterForm.username)) {
    alert('用户名需为 3-16 位字母/数字/下划线');
    return;
  }
  
  // 验证邮箱格式（如果填写了邮箱）
  if (userRegisterForm.email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userRegisterForm.email)) {
      alert('请输入有效的邮箱地址');
      return;
    }
  }
  
  // 验证验证码
  if (userRegisterForm.code.length !== 4) {
    alert('验证码需为 4 位数字');
    refreshUserRegisterCaptcha();
    return;
  }
  
  // 验证验证码是否正确
  if (userRegisterForm.code.toLowerCase() !== userRegisterCaptchaText.value.toLowerCase()) {
    alert('用户注册验证码错误');
    refreshUserRegisterCaptcha();
    return;
  }
  
  // 验证密码长度
  if (userRegisterForm.password.length < 6) {
    alert('密码长度至少为 6 位');
    return;
  }
  
  // 调用真实 API 注册
  try {
    const userData = {
      username: userRegisterForm.username,
      email: userRegisterForm.email,
      password: userRegisterForm.password,
      captcha: userRegisterForm.code
    };
    
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userData)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    // 提示注册成功并跳转到登录页
    alert('注册成功，请登录您的账户');
    isRegistering.value = false; // 切换到登录模式
    
    // 不自动登录，让用户手动登录
    // 清空注册表单
    userRegisterForm.username = '';
    userRegisterForm.email = '';
    userRegisterForm.code = '';
    userRegisterForm.password = '';
    userRegisterForm.confirmPassword = '';
  } catch (err) {
    alert('注册失败：' + err.message);
  }
};

const handlePhoneRegister = async () => {
  // 简单验证输入
  if (!phoneRegisterForm.phone || !phoneRegisterForm.password) {
    alert('请填写手机号和密码');
    return;
  }

  if (phoneRegisterForm.password !== phoneRegisterForm.confirmPassword) {
    alert('两次输入的密码不一致');
    return;
  }

  // 验证手机号格式
  const phoneRegex = /^1[3-9]\d{9}$/;
  if (!phoneRegex.test(phoneRegisterForm.phone)) {
    alert('请输入有效的手机号');
    return;
  }

  // 验证邮箱格式（如果填写了邮箱）
  if (phoneRegisterForm.email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(phoneRegisterForm.email)) {
      alert('请输入有效的邮箱地址');
      return;
    }
  }

  // 调用真实 API 手机注册
  try {
    const userData = {
      phone: phoneRegisterForm.phone,
      email: phoneRegisterForm.email,
      password: phoneRegisterForm.password,
      captcha: phoneRegisterForm.code
    };
    
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userData)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    // 提示注册成功并切换到登录模式
    alert('注册成功，请登录您的账户');
    isRegistering.value = false; // 嵌套，切换到登录模式
    
    // 清空注册表单
    phoneRegisterForm.phone = '';
    phoneRegisterForm.email = '';
    phoneRegisterForm.code = '';
    phoneRegisterForm.password = '';
    phoneRegisterForm.confirmPassword = '';
  } catch (err) {
    alert('注册失败：' + err.message);
  }
};

// 生成验证码文本
const generateCaptchaText = () => {
  const chars = '0123456789';
  let result = '';
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// 绘制用户注册验证码
const drawUserRegisterCaptcha = () => {
  if (!userRegisterCaptchaCanvas.value) return;
  
  const canvas = userRegisterCaptchaCanvas.value;
  const ctx = canvas.getContext('2d');
  userRegisterCaptchaCtx.value = ctx;
  
  // 设置画布尺寸
  canvas.width = 120;
  canvas.height = 40;
  
  // 清空画布
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // 生成验证码文本
  userRegisterCaptchaText.value = generateCaptchaText();
  
  // 绘制背景
  ctx.fillStyle = '#f0f2f5';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // 绘制干扰线
  for (let i = 0; i < 4; i++) {
    ctx.strokeStyle = `rgb(${Math.floor(Math.random() * 155)}, ${Math.floor(Math.random() * 155)}, ${Math.floor(Math.random() * 155)})`;
    ctx.beginPath();
    ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
    ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  
  // 绘制干扰点
  for (let i = 0; i < 30; i++) {
    ctx.fillStyle = `rgb(${Math.floor(Math.random() * 155)}, ${Math.floor(Math.random() * 155)}, ${Math.floor(Math.random() * 155)})`;
    ctx.beginPath();
    ctx.arc(
      Math.random() * canvas.width,
      Math.random() * canvas.height,
      1,
      0,
      2 * Math.PI
    );
    ctx.fill();
  }
  
  // 绘制验证码文字
  const fontSize = 20;
  ctx.font = `${fontSize}px Arial`;
  ctx.textBaseline = 'middle';
  
  // 为每个字符绘制，带不同的旋转角度和位置
  for (let i = 0; i < userRegisterCaptchaText.value.length; i++) {
    const char = userRegisterCaptchaText.value[i];
    
    // 随机颜色
    ctx.fillStyle = `rgb(${Math.floor(Math.random() * 100)}, ${Math.floor(Math.random() * 100)}, ${Math.floor(Math.random() * 100)})`;
    
    // 随机旋转角度
    const angle = (Math.random() - 0.5) * 0.5;
    ctx.save();
    ctx.translate(20 + i * 20, canvas.height / 2);
    ctx.rotate(angle);
    
    // 绘制字符
    ctx.fillText(char, 0, 0);
    ctx.restore();
  }
};

// 绘制手机注册验证码
const drawPhoneRegisterCaptcha = () => {
  if (!phoneRegisterCaptchaCanvas.value) return;
  
  const canvas = phoneRegisterCaptchaCanvas.value;
  const ctx = canvas.getContext('2d');
  phoneRegisterCaptchaCtx.value = ctx;
  
  // 设置画布尺寸
  canvas.width = 120;
  canvas.height = 40;
  
  // 清空画布
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // 生成验证码文本
  phoneRegisterCaptchaText.value = generateCaptchaText();
  
  // 绘制背景
  ctx.fillStyle = '#f0f2f5';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // 绘制干扰线
  for (let i = 0; i < 4; i++) {
    ctx.strokeStyle = `rgb(${Math.floor(Math.random() * 155)}, ${Math.floor(Math.random() * 155)}, ${Math.floor(Math.random() * 155)})`;
    ctx.beginPath();
    ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
    ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  
  // 绘制干扰点
  for (let i = 0; i < 30; i++) {
    ctx.fillStyle = `rgb(${Math.floor(Math.random() * 155)}, ${Math.floor(Math.random() * 155)}, ${Math.floor(Math.random() * 155)})`;
    ctx.beginPath();
    ctx.arc(
      Math.random() * canvas.width,
      Math.random() * canvas.height,
      1,
      0,
      2 * Math.PI
    );
    ctx.fill();
  }
  
  // 绘制验证码文字
  const fontSize = 20;
  ctx.font = `${fontSize}px Arial`;
  ctx.textBaseline = 'middle';
  
  // 为每个字符绘制，带不同的旋转角度和位置
  for (let i = 0; i < phoneRegisterCaptchaText.value.length; i++) {
    const char = phoneRegisterCaptchaText.value[i];
    
    // 随机颜色
    ctx.fillStyle = `rgb(${Math.floor(Math.random() * 100)}, ${Math.floor(Math.random() * 100)}, ${Math.floor(Math.random() * 100)})`;
    
    // 随机旋转角度
    const angle = (Math.random() - 0.5) * 0.5;
    ctx.save();
    ctx.translate(20 + i * 20, canvas.height / 2);
    ctx.rotate(angle);
    
    // 绘制字符
    ctx.fillText(char, 0, 0);
    ctx.restore();
  }
};

// 绘制账户登录验证码
const drawAccountLoginCaptcha = () => {
  if (!accountLoginCaptchaCanvas.value) return;
  
  const canvas = accountLoginCaptchaCanvas.value;
  const ctx = canvas.getContext('2d');
  accountLoginCaptchaCtx.value = ctx;
  
  // 设置画布尺寸
  canvas.width = 120;
  canvas.height = 40;
  
  // 清空画布
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // 生成验证码文本
  accountLoginCaptchaText.value = generateCaptchaText();
  
  // 绘制背景
  ctx.fillStyle = '#f0f2f5';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // 绘制干扰线
  for (let i = 0; i < 4; i++) {
    ctx.strokeStyle = `rgb(${Math.floor(Math.random() * 155)}, ${Math.floor(Math.random() * 155)}, ${Math.floor(Math.random() * 155)})`;
    ctx.beginPath();
    ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
    ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  
  // 绘制干扰点
  for (let i = 0; i < 30; i++) {
    ctx.fillStyle = `rgb(${Math.floor(Math.random() * 155)}, ${Math.floor(Math.random() * 155)}, ${Math.floor(Math.random() * 155)})`;
    ctx.beginPath();
    ctx.arc(
      Math.random() * canvas.width,
      Math.random() * canvas.height,
      1,
      0,
      2 * Math.PI
    );
    ctx.fill();
  }
  
  // 绘制验证码文字
  const fontSize = 20;
  ctx.font = `${fontSize}px Arial`;
  ctx.textBaseline = 'middle';
  
  // 为每个字符绘制，带不同的旋转角度和位置
  for (let i = 0; i < accountLoginCaptchaText.value.length; i++) {
    const char = accountLoginCaptchaText.value[i];
    
    // 随机颜色
    ctx.fillStyle = `rgb(${Math.floor(Math.random() * 100)}, ${Math.floor(Math.random() * 100)}, ${Math.floor(Math.random() * 100)})`;
    
    // 随机旋转角度
    const angle = (Math.random() - 0.5) * 0.5;
    ctx.save();
    ctx.translate(20 + i * 20, canvas.height / 2);
    ctx.rotate(angle);
    
    // 绘制字符
    ctx.fillText(char, 0, 0);
    ctx.restore();
  }
};

// 绘制手机登录验证码
const drawPhoneLoginCaptcha = () => {
  if (!phoneLoginCaptchaCanvas.value) return;
  
  const canvas = phoneLoginCaptchaCanvas.value;
  const ctx = canvas.getContext('2d');
  phoneLoginCaptchaCtx.value = ctx;
  
  // 设置画布尺寸
  canvas.width = 120;
  canvas.height = 40;
  
  // 清空画布
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // 生成验证码文本
  phoneLoginCaptchaText.value = generateCaptchaText();
  
  // 绘制背景
  ctx.fillStyle = '#f0f2f5';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // 绘制干扰线
  for (let i = 0; i < 4; i++) {
    ctx.strokeStyle = `rgb(${Math.floor(Math.random() * 155)}, ${Math.floor(Math.random() * 155)}, ${Math.floor(Math.random() * 155)})`;
    ctx.beginPath();
    ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
    ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  
  // 绘制干扰点
  for (let i = 0; i < 30; i++) {
    ctx.fillStyle = `rgb(${Math.floor(Math.random() * 155)}, ${Math.floor(Math.random() * 155)}, ${Math.floor(Math.random() * 155)})`;
    ctx.beginPath();
    ctx.arc(
      Math.random() * canvas.width,
      Math.random() * canvas.height,
      1,
      0,
      2 * Math.PI
    );
    ctx.fill();
  }
  
  // 绘制验证码文字
  const fontSize = 20;
  ctx.font = `${fontSize}px Arial`;
  ctx.textBaseline = 'middle';
  
  // 为每个字符绘制，带不同的旋转角度和位置
  for (let i = 0; i < phoneLoginCaptchaText.value.length; i++) {
    const char = phoneLoginCaptchaText.value[i];
    
    // 随机颜色
    ctx.fillStyle = `rgb(${Math.floor(Math.random() * 100)}, ${Math.floor(Math.random() * 100)}, ${Math.floor(Math.random() * 100)})`;
    
    // 随机旋转角度
    const angle = (Math.random() - 0.5) * 0.5;
    ctx.save();
    ctx.translate(20 + i * 20, canvas.height / 2);
    ctx.rotate(angle);
    
    // 绘制字符
    ctx.fillText(char, 0, 0);
    ctx.restore();
  }
};

// 刷新各个表单的验证码
const refreshUserRegisterCaptcha = () => {
  drawUserRegisterCaptcha();
};

const refreshPhoneRegisterCaptcha = () => {
  drawPhoneRegisterCaptcha();
};

const refreshAccountLoginCaptcha = () => {
  drawAccountLoginCaptcha();
};

const refreshPhoneLoginCaptcha = () => {
  drawPhoneLoginCaptcha();
};

const isValidPhone = (phone) => {
  const phoneRegex = /^1[3-9]\d{9}$/;
  return phoneRegex.test(phone);
};

const isValidUsername = (username) => {
  const usernameRegex = /^[a-zA-Z0-9_]{3,16}$/;
  return usernameRegex.test(username);
};

onMounted(() => {
  // 初始化时绘制当前表单的验证码
  if (isRegistering.value) {
    if (registerType.value === 'user') {
      drawUserRegisterCaptcha();
    } else {
      drawPhoneRegisterCaptcha();
    }
  } else {
    if (loginType.value === 'account') {
      drawAccountLoginCaptcha();
    } else {
      drawPhoneLoginCaptcha();
    }
  }
});
</script>


<style scoped>
/* 添加固定的高度和最小高度 */
.login-container {
  min-height: 100vh;
  min-width: 100vw;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #6a11cb 0%, #2575fc 100%);
  padding: 4px; /* 进一步减少整体容器的内边距，使页面更紧凑 */
  box-sizing: border-box;
  position: relative;
}

/* 背景图片 */
.login-container.has-bg-image {
  background: url('#') no-repeat center center/cover, linear-gradient(135deg, #b6b6bb 0%, #bcbdbf 100%);
  background-attachment: fixed;
}

.login-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.65);
  z-index: 1;
}

.login-container > .login-form-wrapper {
  position: relative;
  z-index: 2;
  display: flex;
  width: 100%;
  max-width: 280px; /* 缩小最大宽度 */
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.2);
  transition: all 0.3s ease;
}

.login-form-wrapper {
  display: flex;
  width: 100%;
  max-width: 280px; /* 缩小最大宽度 */
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  transition: all 0.3s ease;
}

.login-form-wrapper:hover {
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.3);
  transform: translateY(-5px);
}

.login-form {
  flex: 1;
  padding: 8px; /* 进一步减少内边距，提升紧凑感 */
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.form-header {
  text-align: center;
  margin-bottom: 8px; /* 进一步减少底部间距 */
}

.logo-section {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.logo-circle {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: linear-gradient(135deg, #6a11cb 0%, #2575fc 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 6px; /* 进一步减少底部间距 */
}

.logo-icon {
  font-size: 1.2rem;
  color: white;
}

.welcome-text {
  font-size: 1.1rem;
  color: #2c3e50;
  margin: 0 0 3px 0; /* 进一步减少下边距 */
  font-weight: 600;
}

.subtitle {
  color: #7f8c8d;
  font-size: 0.75rem;
  margin: 0;
}

.tabs {
  display: flex;
  margin-bottom: 8px; /* 进一步减少底部间距 */
  border-bottom: 1px solid #eee;
}

.tab-btn {
  padding: 6px 10px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 0.8rem;
  color: #7f8c8d;
  position: relative;
  transition: all 0.3s ease;
}

.tab-btn.active {
  color: #2575fc;
  font-weight: 500;
}

.tab-btn.active::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  width: 100%;
  height: 3px;
  background: linear-gradient(135deg, #6a11cb 0%, #2575fc 100%);
  border-radius: 3px 3px 0 0;
}

.input-group {
  margin-bottom: 6px; /* 进一步减少底部间距 */
}

.input-group label {
  display: block;
  margin-bottom: 2px;
  font-weight: 500;
  color: #2c3e50;
  font-size: 0.85rem;
}

.verification-input {
  display: flex;
  flex-direction: column;
  gap: 4px; /* 减少间距 */
}

.verification-input .input-field {
  flex: 1;
}

.captcha-wrapper {
  display: flex;
  align-items: center;
  gap: 4px; /* 减少间距 */
}

.captcha-canvas {
  height: 28px; /* 减小高度 */
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  user-select: none;
  width: 90px; /* 减小宽度 */
}

.captcha-refresh {
  font-size: 0.7rem; /* 减小字体 */
  color: #3498db;
  cursor: pointer;
  white-space: nowrap;
}

.captcha-refresh:hover {
  text-decoration: underline;
  color: #2980b9;
}

.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px; /* 进一步减少底部间距 */
  font-size: 0.8rem;
}

.checkbox-label {
  display: flex;
  align-items: center;
  cursor: pointer;
  color: #7f8c8d;
}

.checkbox-label input {
  display: none;
}

.checkmark {
  width: 12px; /* 减小大小 */
  height: 12px; /* 减小大小 */
  border: 2px solid #ddd;
  border-radius: 4px;
  margin-right: 4px;
  position: relative;
  transition: all 0.3s ease;
}

.checkbox-label input:checked + .checkmark {
  background: linear-gradient(135deg, #6a11cb 0%, #2575fc 100%);
  border-color: #6a11cb;
}

.checkbox-label input:checked + .checkmark::after {
  content: '✓';
  position: absolute;
  color: white;
  font-size: 0.6rem;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.forgot-password {
  color: #3498db;
  text-decoration: none;
  transition: color 0.3s ease;
}

.forgot-password:hover {
  color: #2980b9;
  text-decoration: underline;
}

.login-btn {
  width: 100%;
  padding: 8px;
  font-size: 0.9rem;
  margin: 3px 0 6px; /* 进一步减少边距 */
}

.form-footer {
  text-align: center;
  padding-top: 6px; /* 进一步减少顶部填充 */
  border-top: 1px solid #eee;
  margin-top: auto;
}

.form-footer p {
  color: #7f8c8d;
  margin: 0;
  font-size: 0.8rem;
}

.toggle-link {
  color: #3498db;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.3s ease;
}

.toggle-link:hover {
  color: #2980b9;
  text-decoration: underline;
}

/* 隐藏已删除的侧边栏样式 */
.login-image {
  display: none;
}

/* 固定的表单元素样式 */
.input-field {
  width: 100%;
  padding: 4px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 0.75rem;
  transition: all 0.3s ease;
  box-sizing: border-box;
}

.input-field:focus {
  border-color: #3498db;
  box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.2);
  outline: none;
}

/* 固定按钮样式 */
.btn {
  width: 100%;
  padding: 6px;
  border: none;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 2px;
  box-shadow: 0 3px 5px rgba(50, 50, 93, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08);
}

.login-btn {
  background: linear-gradient(135deg, #6a11cb 0%, #2575fc 100%);
  color: white;
}

.login-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 10px rgba(50, 50, 93, 0.1), 0 2px 4px rgba(0, 0, 0, 0.08);
}

.login-btn:active {
  transform: translateY(0);
}

/* 固定卡片样式 */
.card {
  background: rgba(255, 255, 255, 0.9);
  border-radius: 12px; /* 减小圆角 */
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.18);
}

/* 固定响应式设计断点 */
@media (max-width: 768px) {
  .login-container {
    padding: 3px; /* 进一步减少移动端边距 */
    align-items: flex-start;
  }
  
  .login-form {
    padding: 6px; /* 进一步减少移动端的内边距 */
  }
  
  .login-form-wrapper {
    max-width: 100%;
    margin: 0 auto;
  }
  
  .verification-input {
    flex-direction: column;
    align-items: stretch;
  }
  
  .captcha-wrapper {
    justify-content: center;
    margin-top: 5px;
  }
  
  .welcome-text {
    font-size: 1.0rem;
  }
  
  .tab-btn {
    padding: 5px 7px;
    font-size: 0.7rem;
  }
}

/* 额外固定样式：确保在各种屏幕上的稳定性 */
@media (max-width: 480px) {
  .login-form-wrapper {
    max-width: 100%;
    width: 100%;
  }
  
  .login-container {
    padding: 2px; /* 进一步减少移动端边距 */
    min-height: 100vh;
  }
}
</style>
