import { createRouter, createWebHashHistory } from "vue-router";
import type { RouteRecordRaw } from 'vue-router'
// import App from "../App.vue";

const routes: Array<RouteRecordRaw> = [
  {
    path: "/",
    name: "index",
    component: () => import("../views/index.vue"),
  },
  {
    path: "/images",
    name: "images",
    component: () => import("../views/images.vue"),
  },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior(_to: any, _from: any, savedPosition: any) {
    // 滚动行为控制
    if (savedPosition) {
      return savedPosition;
    } else {
      return { top: 0 };
    }
  },
});

// 全局前置守卫
router.beforeEach((_to: any, _from: any, next: any) => {
  document.title = _to.meta.title || "ヰ世界情緒 6th Countdown";
  next();
});

// 全局后置钩子
router.afterEach((_to: any, _from: any) => {
  // 可以在这里发送页面浏览统计
});

export default router;
