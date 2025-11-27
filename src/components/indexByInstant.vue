<template>
  <div class="page-instant">
    <div class="instant-photos-container">
      <div
        v-for="(photo, index) in randomPhotos"
        :key="index"
        class="instant-photo-item"
        :style="photo.style"
      >
        <div class="photo-frame">
          <img
            :src="photo.smallUrl"
            :alt="`Photo ${index + 1}`"
            class="photo-image"
            @load="handleImageLoad"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import { IMAGES } from "../utils/default.ts";

const randomPhotos = ref([]);

// 存储初始视口尺寸
const initialViewport = ref({ width: 0, height: 0 });

// 随机选择8-10张图片
const selectRandomPhotos = () => {
  // 收集所有图片
  const allImages = [];
  IMAGES.forEach((day) => {
    day.children.forEach((image) => {
      if (image.smallUrl) {
        allImages.push({
          smallUrl: image.smallUrl,
          name: image.name,
          days: day.days,
        });
      }
    });
  });

  // 随机选择8-10张
  const photoCount = Math.floor(Math.random() * 3) + 8; // 8-10张
  const selectedImages = [];
  const usedIndices = new Set();

  while (selectedImages.length < photoCount && selectedImages.length < allImages.length) {
    const randomIndex = Math.floor(Math.random() * allImages.length);
    if (!usedIndices.has(randomIndex)) {
      usedIndices.add(randomIndex);
      selectedImages.push(allImages[randomIndex]);
    }
  }

  // 基于初始视口生成稀疏分布的位置
  const viewportWidth = initialViewport.value.width || window.innerWidth;
  const viewportHeight = initialViewport.value.height || window.innerHeight;
  
  const photos = selectedImages.map((image, index) => {
    // 扩展到更大范围的稀疏位置（超出视口边界）
    // 确保图片至少有一半在屏幕内
    const positions = [
      { x: -20, y: 10 },   // 左侧，一半在屏幕内
      { x: 120, y: 15 },  // 右侧，一半在屏幕内
      { x: 10, y: -25 },  // 上方，一半在屏幕内
      { x: 80, y: 125 },  // 下方，一半在屏幕内
      { x: 15, y: 60 },   // 左中
      { x: 85, y: 40 },   // 右中
      { x: 45, y: 15 },   // 上中
      { x: 55, y: 85 },   // 下中
      { x: -15, y: 70 },  // 左下角
      { x: 115, y: 30 },  // 右上角
      { x: 25, y: 110 },  // 下左
      { x: 75, y: -20 },  // 上右
    ];

    // 随机选择位置，确保分布稀疏
    const position = positions[index % positions.length];
    
    // 添加随机偏移，增加自然感
    const randomOffsetX = (Math.random() - 0.5) * 15; // -7.5% 到 7.5%
    const randomOffsetY = (Math.random() - 0.5) * 15; // -7.5% 到 7.5%
    
    const finalX = position.x + randomOffsetX;
    const finalY = position.y + randomOffsetY;

    // 随机旋转角度（-30到30度，避免完全倒置）
    const rotation = Math.random() * 60 - 30;

    // 随机动画延迟和持续时间
    const animationDelay = Math.random() * 2; // 0-2秒延迟
    const animationDuration = 1.5 + Math.random() * 1.5; // 1.5-3秒

    return {
      ...image,
      style: {
        position: 'absolute',
        left: `${finalX}%`,
        top: `${finalY}%`,
        transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
        animation: `slideIn ${animationDuration}s ease-out ${animationDelay}s both`,
        zIndex: Math.floor(Math.random() * 10) + 1, // 随机层级
        '--rotation': `${rotation}deg`,
      }
    };
  });

  randomPhotos.value = photos;
};

// 处理图片加载
const handleImageLoad = (event) => {
  const img = event.target;
  // 确保图片等比显示
  const maxSize = window.innerWidth * 0.3; // 30vw
  const width = img.naturalWidth;
  const height = img.naturalHeight;
  
  if (width > height) {
    img.style.width = `${Math.min(maxSize, width)}px`;
    img.style.height = 'auto';
  } else {
    img.style.height = `${Math.min(maxSize, height)}px`;
    img.style.width = 'auto';
  }
};

onMounted(() => {
  // 保存初始视口尺寸
  initialViewport.value = {
    width: window.innerWidth,
    height: window.innerHeight
  };
  selectRandomPhotos();
});

onUnmounted(() => {});
</script>

<style scoped lang="less">
.page-instant {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  width: 100%;
  color: white;
  overflow: hidden;
  position: relative;
}

.instant-photos-container {
  position: relative;
  width: 100vw;
  height: 100vh;
  // 不限制最大宽高，允许图片超出视口
}

.instant-photo-item {
  position: absolute;
  transition: transform 0.3s ease;
}

.photo-frame {
  background: white;
  padding: 12px;
  border-radius: 2px;
  box-shadow: 
    0 4px 8px rgba(0, 0, 0, 0.3),
    0 1px 3px rgba(0, 0, 0, 0.2),
    inset 0 0 0 1px rgba(255, 255, 255, 0.1);
  position: relative;
  
  // 拍立得相纸的经典边框
  border: 1px solid #e0e0e0;
  
  // 模拟拍立得相纸的质感
  background: linear-gradient(
    135deg,
    #ffffff 0%,
    #f8f8f8 100%
  );
  
  // 添加轻微的纹理效果
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: 
      repeating-linear-gradient(
        45deg,
        transparent,
        transparent 2px,
        rgba(0, 0, 0, 0.01) 2px,
        rgba(0, 0, 0, 0.01) 4px
      );
    pointer-events: none;
    border-radius: 2px;
  }
}

.photo-image {
  display: block;
  max-width: 30vw;
  max-height: 30vw;
  object-fit: contain;
  
  // 确保图片不会超出边框
  width: auto;
  height: auto;
  
  // 图片边框
  border: 1px solid #d0d0d0;
}

// 入场动画
@keyframes slideIn {
  0% {
    transform: translate(-50%, 150%) rotate(0deg);
    opacity: 0;
  }
  50% {
    opacity: 0.8;
  }
  100% {
    transform: translate(-50%, -50%) rotate(var(--rotation, 0deg));
    opacity: 1;
  }
}

// 响应式调整
@media (max-width: 768px) {
  .photo-frame {
    padding: 8px;
  }
  
  .photo-image {
    max-width: 40vw;
    max-height: 40vw;
  }
}

@media (max-width: 480px) {
  .photo-frame {
    padding: 6px;
  }
  
  .photo-image {
    max-width: 50vw;
    max-height: 50vw;
  }
}

// 悬停效果（可选）
.instant-photo-item:hover {
  transform: translate(-50%, -50%) scale(1.05) rotate(var(--rotation, 0deg));
  z-index: 100;
  transition: transform 0.2s ease;
}
</style>