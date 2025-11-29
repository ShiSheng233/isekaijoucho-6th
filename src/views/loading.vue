<template>
  <div class="loading-page">
    <div class="loading-container">
      <!-- 加载标题 -->
      <div class="loading-title" v-if="!loadError">Loading</div>
      
      <!-- 简化的加载动画 -->
      <div class="loading-spinner" v-if="!loadError">
        <div class="spinner-ring"></div>
      </div>
      <div class="loading-progress" v-if="!loadError">{{ Math.round(progress) }}%</div>
      
      <!-- 加载失败提示 -->
      <div class="error-message" v-if="loadError">
        <div class="error-icon">⚠</div>
        <div class="error-text">Failed to load images</div>
        <div class="error-hint">Please check your network connection or try using a VPN</div>
        <button class="retry-btn" @click="retryLoading">RETRY</button>
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
const loadError = ref(false);

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
  loadError.value = false;
  progress.value = 0;

  if (imageUrls.length === 0) {
    progress.value = 100;
    setTimeout(() => emit("loaded"), 500);
    return;
  }

  try {
    await preloadImagesWithProgress(imageUrls, (current, total, percentage) => {
      progress.value = percentage;
    });

    // 确保进度条显示100%
    progress.value = 100;

    // 加载完成后延迟500ms自动切换，给用户反应时间
    setTimeout(() => emit("loaded"), 500);
  } catch (error) {
    console.error("图片加载失败:", error);
    loadError.value = true;
  }
};

// 重试加载
const retryLoading = () => {
  window.location.reload();
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
  gap: 20px;
}

.loading-title {
  font-family: "DIN Alternate", sans-serif;
  font-size: 32px;
  font-weight: bold;
  letter-spacing: 4px;
  opacity: 0.9;
  text-transform: uppercase;
}

.loading-progress {
  font-family: "DIN Alternate", sans-serif;
  font-size: 18px;
  letter-spacing: 2px;
  opacity: 0.8;
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

.error-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
  
  .error-icon {
    font-size: 48px;
    opacity: 0.8;
  }
  
  .error-text {
    font-size: 18px;
    font-weight: bold;
    letter-spacing: 1px;
  }
  
  .error-hint {
    font-size: 14px;
    opacity: 0.7;
    text-align: center;
    max-width: 300px;
    line-height: 1.5;
  }
  
  .retry-btn {
    margin-top: 10px;
    padding: 10px 30px;
    background: transparent;
    border: 1px solid #fff;
    color: #fff;
    font-size: 14px;
    letter-spacing: 2px;
    cursor: pointer;
    transition: all 0.3s ease;
    
    &:hover {
      background: #fff;
      color: #000;
    }
  }
}
</style>
