import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'
import { initIOSOptimizations } from './utils/iosOptimization'

// 初始化iOS优化
initIOSOptimizations()

createApp(App).use(router).mount('#app')
