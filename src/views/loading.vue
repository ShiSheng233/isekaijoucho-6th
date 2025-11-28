<template>
  <div class="loading-page">
    <div class="loading-container">
      <!-- 简化的加载动画 -->
      <div class="loading-spinner">
        <div class="spinner-ring"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { IMAGES } from "../utils/default";
import { preloadImagesWithProgress } from "../utils/imageLoader";

const emit = defineEmits(["loaded"]);
const progress = ref(0);

// 收集所有图片URL
const getAllImageUrls = () => {
  const urls = [];
  IMAGES.forEach((item) => {
    item.children.forEach((child) => {
      if (child.url && child.url.trim() !== "") {
        urls.push(child.url);
      }
    });
  });
  return urls;
};

// 开始加载图片
const startLoading = async () => {
  const imageUrls = getAllImageUrls();

  if (imageUrls.length === 0) {
    progress.value = 100;
    setTimeout(() => emit("loaded"), 300);
    return;
  }

  try {
    await preloadImagesWithProgress(imageUrls, (current, total, percentage) => {
      progress.value = percentage;
    });

    // 加载完成后延迟300ms自动切换
    setTimeout(() => emit("loaded"), 300);
  } catch (error) {
    console.error("图片加载失败:", error);
    // 即使加载失败也自动切换
    setTimeout(() => emit("loaded"), 300);
  }
};

onMounted(() => {
  startLoading();
});
</script>

<style scoped lang="less">
.loading-page {
  height: 100vh;
  width: 100vw;
  position: fixed;
  top: 0;
  left: 0;
  overflow: hidden;
  background: #000000;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  z-index: 9999;
}

.loading-container {
  position: relative;
  z-index: 10;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 40px;
}

.loading-spinner {
  position: relative;
  width: 60px;
  height: 60px;

  .spinner-ring {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 100%;
    height: 100%;
    border: 2px solid transparent;
    border-top-color: #ffffff;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
}

@keyframes spin {
  0% {
    transform: translate(-50%, -50%) rotate(0deg);
  }
  100% {
    transform: translate(-50%, -50%) rotate(360deg);
  }
}
</style>
