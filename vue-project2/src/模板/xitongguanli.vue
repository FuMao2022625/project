<template>
  <div class="profile-center">
    <div class="header-section card">
      <div class="avatar-section">
        <img src="https://via.placeholder.com/100x100" alt="头像" class="avatar">
        <div class="user-info">
          <h2 class="username">用户名</h2>
          <p class="user-role">角色：管理员</p>
        </div>
      </div>
    </div>

    <div class="settings-grid">
      <div class="setting-category card">
        <div class="category-header">
          <h3>个人信息</h3>
          <p>查看和编辑个人资料</p>
        </div>
        <div class="category-actions">
          <button class="btn">编辑资料</button>
        </div>
      </div>

      <div class="setting-category card">
        <div class="category-header">
          <h3>账户安全</h3>
          <p>修改密码和切换账户</p>
        </div>
        <div class="category-actions">
          <button class="btn" @click="showChangePasswordModal">修改密码</button>
          <button class="btn btn-secondary" @click="showSwitchAccountModal">切换账户</button>
        </div>
      </div>

      <div class="setting-category card">
        <div class="category-header">
          <h3>个人设置</h3>
          <p>个性化和偏好设置</p>
        </div>
        <div class="category-actions">
          <button class="btn">外观设置</button>
          <button class="btn btn-secondary">语言设置</button>
        </div>
      </div>

      <div class="setting-category card">
        <div class="category-header">
          <h3>我的收藏</h3>
          <p>查看和管理收藏内容</p>
        </div>
        <div class="category-actions">
          <button class="btn">查看收藏</button>
          <button class="btn btn-secondary">管理收藏</button>
        </div>
      </div>

      <div class="setting-category card">
        <div class="category-header">
          <h3>消息通知</h3>
          <p>设置通知偏好和接收方式</p>
        </div>
        <div class="category-actions">
          <button class="btn">通知设置</button>
          <button class="btn btn-secondary">查看历史</button>
        </div>
      </div>

      <div class="setting-category card">
        <div class="category-header">
          <h3>活动记录</h3>
          <p>查看最近的活动和操作记录</p>
        </div>
        <div class="category-actions">
          <button class="btn">查看记录</button>
          <button class="btn btn-secondary">导出记录</button>
        </div>
      </div>
    </div>

    <div class="system-actions card">
      <h3>账户操作</h3>
      <div class="actions-grid">
        <button class="action-btn danger" @click="logout">
          <i class="icon">🚪</i>
          退出登录
        </button>
        <button class="action-btn warning" @click="showAccountDeletionConfirm">
          <i class="icon">🔄</i>
          注销账户
        </button>
        <button class="action-btn primary">
          <i class="icon">📋</i>
          下载数据
        </button>
        <button class="action-btn secondary">
          <i class="icon">❓</i>
          帮助中心
        </button>
      </div>
    </div>
    
    <!-- 注销账户确认弹窗 -->
    <div v-if="showDeletionModal" class="modal-overlay" @click="closeDeletionModal">
      <div class="modal-content" @click.stop>
        <h3>确认注销账户</h3>
        <p>此操作将永久删除您的账户和所有相关数据。</p>
        <p><strong>警告：此操作无法撤销！</strong></p>
        
        <div class="modal-actions">
          <button class="btn btn-secondary" @click="closeDeletionModal">取消</button>
          <button class="btn btn-danger" @click="confirmAccountDeletion">确认注销</button>
        </div>
      </div>
    </div>
    
    <!-- 修改密码弹窗 -->
    <div v-if="showPasswordModal" class="modal-overlay" @click="closePasswordModal">
      <div class="modal-content" @click.stop>
        <h3>修改密码</h3>
        <form @submit.prevent="changePassword">
          <div class="input-group">
            <label for="current-password">当前密码</label>
            <input type="password" id="current-password" v-model="currentPassword" required>
          </div>
          
          <div class="input-group">
            <label for="new-password">新密码</label>
            <input type="password" id="new-password" v-model="newPassword" required minlength="6">
          </div>
          
          <div class="input-group">
            <label for="confirm-new-password">确认新密码</label>
            <input type="password" id="confirm-new-password" v-model="confirmNewPassword" required minlength="6">
          </div>
          
          <div class="modal-actions">
            <button type="button" class="btn btn-secondary" @click="closePasswordModal">取消</button>
            <button type="submit" class="btn btn-primary">确认修改</button>
          </div>
        </form>
      </div>
    </div>
    
    <!-- 切换账户弹窗 -->
    <div v-if="showSwitchModal" class="modal-overlay" @click="closeSwitchModal">
      <div class="modal-content" @click.stop style="width: 90%; max-width: 600px;">
        <h3>切换账户</h3>
        <p>请选择要切换到的账户:</p>
        
        <div class="account-list">
          <div 
            v-for="account in recentAccounts" 
            :key="account.id" 
            class="account-item"
            @click="switchToAccount(account)"
          >
            <div class="account-avatar">
              <img :src="account.avatar || 'https://via.placeholder.com/50x50'" :alt="account.name">
            </div>
            <div class="account-info">
              <h4>{{ account.name }}</h4>
              <p>{{ account.email }}</p>
            </div>
          </div>
        </div>
        
        <div class="divider"></div>
        
        <div class="add-account-option">
          <button class="btn btn-secondary" @click="goToAddAccount">添加新账户</button>
        </div>
        
        <div class="modal-actions">
          <button class="btn btn-secondary" @click="closeSwitchModal">取消</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const showDeletionModal = ref(false);
const showPasswordModal = ref(false);
const showSwitchModal = ref(false);

// 密码修改相关变量
const currentPassword = ref('');
const newPassword = ref('');
const confirmNewPassword = ref('');

// 最近账户列表
const recentAccounts = ref([
  { id: 1, name: '测试用户1', email: 'test1@example.com', avatar: 'https://via.placeholder.com/50x50' },
  { id: 2, name: '管理员', email: 'admin@example.com', avatar: 'https://via.placeholder.com/50x50' },
]);

const logout = () => {
  // 这里可以添加清理用户信息的逻辑，比如清除token等
  localStorage.removeItem('token'); // 示例：清除本地存储的token
  // 跳转到登录页面
  router.push('/login');
};

const showAccountDeletionConfirm = () => {
  showDeletionModal.value = true;
};

const closeDeletionModal = () => {
  showDeletionModal.value = false;
};

const confirmAccountDeletion = async () => {
  // 实际项目中这里应该是调用API删除账户的逻辑
  console.log("正在执行账户注销...");
  
  // 模拟API调用
  try {
    // 在实际项目中，这里会调用API删除账户
    // const response = await accountApi.deleteAccount();
    
    // 删除本地认证信息
    localStorage.clear();
    
    // 显示成功消息
    alert("账户已成功注销");
    
    // 跳转到登录页面
    router.push('/login');
  } catch (error) {
    console.error("注销账户失败:", error);
    alert("注销账户失败，请稍后重试");
  }
  
  // 关闭模态框
  showDeletionModal.value = false;
};

// 显示修改密码弹窗
const showChangePasswordModal = () => {
  // 重置表单
  currentPassword.value = '';
  newPassword.value = '';
  confirmNewPassword.value = '';
  showPasswordModal.value = true;
};

// 关闭修改密码弹窗
const closePasswordModal = () => {
  showPasswordModal.value = false;
};

// 修改密码
const changePassword = async () => {
  // 验证新密码和确认密码是否一致
  if (newPassword.value !== confirmNewPassword.value) {
    alert("新密码和确认密码不一致");
    return;
  }

  // 实际项目中这里应该是调用API修改密码的逻辑
  try {
    // 模拟API调用
    // const response = await authApi.changePassword({
    //   currentPassword: currentPassword.value,
    //   newPassword: newPassword.value
    // });
    
    // 模拟API延迟
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log("密码修改请求已发送", {
      currentPassword: currentPassword.value,
      newPassword: newPassword.value
    });
    
    // 显示成功消息
    alert("密码已成功修改，请使用新密码登录");
    
    // 关闭弹窗
    showPasswordModal.value = false;
  } catch (error) {
    console.error("修改密码失败:", error);
    alert("修改密码失败：" + (error.message || "请检查当前密码是否正确"));
  }
};

// 显示切换账户弹窗
const showSwitchAccountModal = () => {
  showSwitchModal.value = true;
};

// 关闭切换账户弹窗
const closeSwitchModal = () => {
  showSwitchModal.value = false;
};

// 切换到指定账户
const switchToAccount = (account) => {
  console.log(`切换到账户: ${account.name}`);
  // 实际项目中这里应该是切换账户的逻辑
  // 例如：更新本地存储中的用户信息，然后刷新页面或更新应用状态
  
  // 模拟切换账户
  alert(`已切换到账户: ${account.name}`);
  showSwitchModal.value = false;
};

// 添加新账户
const goToAddAccount = () => {
  // 可以跳转到登录页面或者显示注册表单
  alert("将跳转到添加账户页面");
  showSwitchModal.value = false;
  // router.push('/login'); // 或者其他添加账户的页面
};
</script>

<style scoped>
.profile-center {
  padding: 0 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.header-section {
  padding: 25px;
  margin-bottom: 20px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.avatar-section {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.avatar {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  object-fit: cover;
  margin-bottom: 15px;
  border: 4px solid #ddd;
}

.user-info {
  text-align: center;
}

.username {
  margin: 0;
  color: #2c3e50;
  font-size: 1.8rem;
}

.user-role {
  color: #7f8c8d;
  margin: 5px 0 0 0;
}

.settings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.setting-category {
  padding: 25px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.category-header h3 {
  color: #2c3e50;
  margin: 0 0 10px 0;
  font-size: 1.3rem;
}

.category-header p {
  color: #7f8c8d;
  margin: 0;
}

.category-actions {
  display: flex;
  gap: 10px;
  margin-top: 20px;
  justify-content: flex-end;
}

.system-info {
  padding: 25px;
  margin-bottom: 20px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-top: 15px;
}

.info-item {
  display: flex;
  flex-direction: column;
}

.info-item label {
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 5px;
  font-size: 0.9rem;
}

.info-item p {
  color: #7f8c8d;
  margin: 0;
}

.system-actions {
  padding: 25px;
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
  margin-top: 15px;
}

.action-btn {
  padding: 20px;
  border-radius: 12px;
  border: none;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  font-size: 1rem;
  transition: all 0.3s ease;
  text-align: center;
}

.action-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
}

.action-btn i {
  font-size: 1.8rem;
}

.action-btn.danger {
  background: linear-gradient(135deg, #ff416c 0%, #ff4b2b 100%);
  color: white;
}

.action-btn.warning {
  background: linear-gradient(135deg, #ffb347 0%, #ffcc33 100%);
  color: white;
}

.action-btn.primary {
  background: linear-gradient(135deg, #6a11cb 0%, #2575fc 100%);
  color: white;
}

.action-btn.secondary {
  background: linear-gradient(135deg, #6c757d 0%, #495057 100%);
  color: white;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 25px;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}

.modal-content h3 {
  margin-top: 0;
  color: #e74c3c;
  text-align: center;
}

.modal-actions {
  display: flex;
  gap: 15px;
  justify-content: center;
  margin-top: 20px;
}

.btn {
  padding: 10px 20px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  font-size: 1rem;
}

.btn-secondary {
  background-color: #6c757d;
  color: white;
}

.btn-danger {
  background-color: #dc3545;
  color: white;
}

@media (max-width: 768px) {
  .settings-grid {
    grid-template-columns: 1fr;
  }
  
  .actions-grid {
    grid-template-columns: 1fr;
  }
  
  .category-actions {
    flex-direction: column;
  }
  
  .info-grid {
    grid-template-columns: 1fr;
  }
  
  .modal-content {
    width: 95%;
    margin: 0 20px;
  }
  
  .modal-actions {
    flex-direction: column;
  }
}
</style>