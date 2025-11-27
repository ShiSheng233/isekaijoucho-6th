<template>
  <div
    class="scroll-container"
    @wheel="handleWheel"
    @touchstart="handleTouchStart"
    @touchmove="handleTouchMove"
    @touchend="handleTouchEnd"
  >
    <router-view v-slot="{ Component }">
      <transition :name="transitionName">
        <component
          :is="Component"
          :state="childScrollState"
          @scroll-state="handleChildScrollState"
          @preview-state="handlePreviewState"
        />
      </transition>
    </router-view>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();
const transitionName = ref("slide-down");

// 子组件的滚动状态
const childScrollState = ref({
  isAtTop: true,
  isAtBottom: false,
  canScroll: false,
});

// 图片预览状态
const previewState = ref({
  isPreviewOpen: false,
});

let touchStartY = 0;
let isSwiping = false;
let currentPage = ref("");

// 处理子组件传来的滚动状态
const handleChildScrollState = (state) => {
  childScrollState.value = state;
};

// 处理图片预览状态
const handlePreviewState = (state) => {
  previewState.value = state;
};

// 处理滚动事件
const handleWheel = (event) => {
  currentPage = router.currentRoute.value.path;

  // 如果图片预览打开，阻止所有跳转
  if (previewState.value.isPreviewOpen) {
    event.preventDefault();
    return;
  }

  // 如果在 B 页面且不在顶部，允许 B 页面自己滚动
  if (currentPage === "/images" && !childScrollState.value.isAtTop) {
    return; // 不阻止事件，让 B 页面自己处理滚动
  }

  // 如果在 B 页面顶部且向上滚动，切换到 A
  if (
    currentPage === "/images" &&
    childScrollState.value.isAtTop &&
    event.deltaY < -50
  ) {
    event.preventDefault();
    transitionName.value = "slide-down";
    router.push("/");
    return;
  }

  // 如果在 A 页面且向下滚动，切换到 B
  if (currentPage === "/" && event.deltaY > 50) {
    event.preventDefault();
    transitionName.value = "slide-up";
    router.push("/images");
    return;
  }

  // 其他情况阻止默认行为，避免页面滚动
  if (
    currentPage === "/" ||
    (currentPage === "/images" && childScrollState.value.isAtTop)
  ) {
    event.preventDefault();
  }
};

const handleTouchStart = (event) => {
  touchStartY = event.touches[0].clientY;
  isSwiping = false;
  currentPage = router.currentRoute.value.path;
  
  // 防止浏览器默认下拉刷新
  if (currentPage === "/images") {
    event.preventDefault();
  }
};

const handleTouchMove = (event) => {
  const touchCurrentY = event.touches[0].clientY;
  const diff = touchStartY - touchCurrentY;

  // 如果图片预览打开，阻止所有跳转
  if (previewState.value.isPreviewOpen) {
    event.preventDefault();
    return;
  }

  // 如果在 B 页面且不在顶部，允许滚动（不阻止事件）
  if (currentPage === "/images" && !childScrollState.value.isAtTop) {
    return; // 让事件继续传播，B页面可以处理滚动
  }

  // 如果在 B 页面顶部且向上滑动，阻止默认行为准备切换
  if (
    currentPage === "/images" &&
    childScrollState.value.isAtTop &&
    diff < -20
  ) {
    event.preventDefault();
    isSwiping = true;
  }

  // 在 A 页面或 B 页面顶部时，阻止默认滚动
  if (
    currentPage === "/" ||
    (currentPage === "/images" && childScrollState.value.isAtTop)
  ) {
    event.preventDefault();
  }
  
  // 特别处理：在 images 页面顶部向下滑动时，阻止浏览器下拉刷新
  if (
    currentPage === "/images" &&
    childScrollState.value.isAtTop &&
    diff > 20
  ) {
    event.preventDefault();
  }
};

const handleTouchEnd = (event) => {
  const touchEndY = event.changedTouches[0].clientY;
  const diff = touchStartY - touchEndY;

  // 如果图片预览打开，阻止所有跳转
  if (previewState.value.isPreviewOpen) {
    return;
  }

  // 如果在 B 页面且不在顶部，不处理切换
  if (currentPage === "/images" && !childScrollState.value.isAtTop) {
    return;
  }

  // 滑动距离阈值
  if (Math.abs(diff) > 50) {
    if (currentPage === "/" && diff > 0) {
      // A → B：向下滑动
      transitionName.value = "slide-up";
      router.push("/images");
    } else if (
      currentPage === "/images" &&
      diff < 0 &&
      childScrollState.value.isAtTop
    ) {
      // B → A：向上滑动（仅在顶部时）
      transitionName.value = "slide-down";
      router.push("/");
    }
  }

  isSwiping = false;
};

// 监听路由变化
router.afterEach((to) => {
  currentPage = to.path;
});
</script>

<style scoped>
.scroll-container {
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  position: relative;
  touch-action: none; /* 禁用所有默认触摸行为，完全自定义 */
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: none; /* 防止滚动链和下拉刷新 */
  -webkit-overscroll-behavior: none; /* Safari 兼容 */
}

.slide-up-enter-active,
.slide-up-leave-active,
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.6s ease;
}

.slide-up-enter-from {
  transform: translateY(100vh);
}
.slide-up-leave-to {
  transform: translateY(-100vh);
}

.slide-down-enter-from {
  transform: translateY(-100vh);
}
.slide-down-leave-to {
  transform: translateY(100vh);
}
</style>

<style>
html,
body {
  margin: 0;
  padding: 0;
  overflow: hidden;
  height: 100%;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: none; /* 全局禁止下拉刷新 */
  -webkit-overscroll-behavior: none; /* Safari 兼容 */
  position: fixed; /* 防止 iOS 弹跳 */
  width: 100%;
  height: 100%;
}

/* 防止移动端下拉刷新 */
body {
  touch-action: none;
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  user-select: none;
}
</style>
