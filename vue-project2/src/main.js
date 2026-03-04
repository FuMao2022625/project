// src/main.js
import { createApp } from 'vue'
import './模板/style.css'
import App from './模板/App.vue'

// ✅ 关键代码：导入上面写好的路由实例 ✅【路由-导入实例】z
import router from './router/index.js'
import { Colors } from 'chart.js';

console.log('Router object:', router); // 添加调试信息

const app = createApp(App)


// ✅ 关键代码：全局注册路由，Vue3的use挂载方式 ✅【路由-注册生效】
app.use(router)

console.log('Mounting app...'); // 添加调试信息
app.mount('#app')// 挂载Vue实例
console.log('App mounted successfully!'); // 添加调试信息