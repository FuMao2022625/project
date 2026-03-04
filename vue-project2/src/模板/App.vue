<template>
  <div id="app">
    <header class="site-header" v-if="!isLoginPage">
      <div class="container-nav">
        <div class="logo-container">
          <h1 class="logo">智能巡检系统</h1>
          <p class="tagline">高效 · 安全 · 智能</p>
        </div>
        <nav class="main-nav">
          <router-link to="/shouye" class="nav-link">首页</router-link>
          <router-link to="/shebeiguanli" class="nav-link">设备管理</router-link>
          <router-link to="/xiaoxizhongxin" class="nav-link">消息中心</router-link>
          <router-link to="/shujvguanli" class="nav-link">数据管理</router-link>
          <router-link to="/xitongguanli" class="nav-link">系统管理</router-link>
        </nav>
      </div>
    </header>
    
    <main class="main-content">
      <router-view />
    </main>
    
    <footer class="site-footer" v-if="!isHomePage && !isLoginPage">
      <div class="container-footer">
        <p>&copy; 2026 智慧管理系统. 保留所有权利.</p>
        <div class="footer-links">
          <a href="#" class="footer-link">隐私政策</a>
          <a href="#" class="footer-link">使用条款</a>
          <a href="#" class="footer-link">联系我们</a>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { useRoute, useRouter } from 'vue-router'
import { computed } from 'vue'

const route = useRoute()
const router = useRouter()

// 计算属性：判断当前是否为首页或登录页
const isHomePage = computed(() => {
  return route.path === '/shouye' || route.path === '/'
})

// 计算属性：判断当前是否为登录页
const isLoginPage = computed(() => {
  return route.path === '/login'
})
</script>

<style scoped>
/* 导航栏在登录页面隐藏时的样式调整 */
#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

.site-header {
  background: white;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  position: sticky;
  top: 0;
  z-index: 100;
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.5);
}

.container-nav {
  max-width: 1200px;
  margin: 0 auto;
  padding: 15px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
}

.logo-container {
  display: flex;
  flex-direction: column;
}

.logo {
  font-size: 1.8rem;
  font-weight: 700;
  color: #2575fc;
  margin: 0;
  background: linear-gradient(135deg, #6a11cb, #2575fc);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.tagline {
  font-size: 0.8rem;
  color: #7f8c8d;
  margin-top: 4px;
  font-weight: 500;
}

.main-nav {
  display: flex;
  gap: 1.2rem;
  flex-wrap: wrap;
  justify-content: center;
}

.nav-link {
  font-weight: 500;
  color: #555;
  text-decoration: none;
  padding: 10px 18px;
  border-radius: 30px;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  border: 1px solid transparent;
}

.nav-link::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 0;
  height: 100%;
  background: linear-gradient(135deg, #6a11cb 0%, #2575fc 100%);
  transition: width 0.4s ease;
  z-index: -1;
  border-radius: 30px;
}

.nav-link:hover {
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(37, 117, 252, 0.3);
}

.nav-link:hover::before {
  width: 100%;
}

.nav-link.router-link-exact-active {
  color: white;
  background: linear-gradient(135deg, #6a11cb 0%, #2575fc 100%);
  box-shadow: 0 4px 10px rgba(37, 117, 252, 0.3);
}


.main-content {
  flex-grow: 1;
  padding: 2rem 1rem;
  min-height: calc(100vh - 200px);
}

.site-footer {
  background: #2c3e50;
  color: #ecf0f1;
  padding: 2rem 0;
  margin-top: auto;
}

.container-footer {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
}

.footer-links {
  display: flex;
  gap: 1.5rem;
}

.footer-link {
  color: #bdc3c7;
  text-decoration: none;
  transition: color 0.3s ease;
}

.footer-link:hover {
  color: #3498db;
}

@media (max-width: 768px) {
  .container-nav {
    flex-direction: column;
    gap: 1rem;
  }
  
  .main-nav {
    gap: 0.5rem;
    margin-top: 10px;
  }
  
  .container-footer {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }
  
  .footer-links {
    justify-content: center;
  }
}
</style>
