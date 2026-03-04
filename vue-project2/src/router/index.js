import { createRouter, createWebHistory } from 'vue-router';
import ShouyeView from '../模板/shouye.vue'; // 首页
import ShebeiguanliView from '../模板/shebeiguanli.vue';    //设备管理
import Login from '../模板/Login.vue'; // 登录页
import XiaoxizhongxinView from '../模板/xiaoxizhongxin.vue'; // 消息中心
import ShujvguanliView from '../模板/shujvguanli.vue';// 数据管理
import XitongguanliView from '../模板/xitongguanli.vue'; // 系统管理

const routes = [
  {
    path: '/shouye',
    name: 'Shouye',
    component: ShouyeView,
    meta: { requiresAuth: true }  // 需要认证
  },// 首页
  {
    path: '/shebeiguanli',
    name: 'Shebeiguanli',
    component: ShebeiguanliView,
    meta: { requiresAuth: true }  // 需要认证
  },// 设备管理
  {
    path: '/login',
    name: 'Login',
    component: Login
  },// 登录页
  {
    path: '/xiaoxizhongxin', // 消息中心
    name: 'Xiaoxizhongxin',
    component: XiaoxizhongxinView,
    meta: { requiresAuth: true }  // 需要认证
  },// 消息中心
  {
      path: '/shujvguanli',
      name: 'Shujvguanli',
      component: ShujvguanliView,
      meta: { requiresAuth: true }  // 需要认证
  },// 数据管理
  {
    path: '/xitongguanli',
    name: 'Xitongguanli',
    component: XitongguanliView,
    meta: { requiresAuth: true }  // 需要认证
  }, // 系统管理
  {
    path: '/',
    redirect: to => {
      // 检查是否已登录
      const token = localStorage.getItem('token');
      return token ? '/shouye' : '/login';
    }
  },
  // 添加通配符路由，确保未知路径也根据登录状态重定向
  {
    path: '/:pathMatch(.*)*',
    redirect: to => {
      // 检查是否已登录
      const token = localStorage.getItem('token');
      return token ? '/shouye' : '/login';
    }
  }
];

// 创建路由器实例
const router = createRouter({
  history: createWebHistory(),
  routes
});

// 添加路由守卫，确保访问受保护页面时需要登录
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token');
  
  if (to.meta.requiresAuth && !token) {
    // 如果访问的是需要认证的页面且未登录，重定向到登录页
    next('/login');
  } else if (to.path === '/login' && token) {
    // 如果已登录且尝试访问登录页，重定向到首页
    next('/shouye');
  } else {
    // 否则允许访问
    next();
  }
});

// 导出路由器实例
export default router;