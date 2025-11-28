<template>
  <div v-if="visible" class="image-preview-overlay" @click="handleOverlayClick">
    <div class="preview-container">
      <!-- 关闭按钮 -->
      <button class="close-btn" @click="close">×</button>

      <!-- 左右切换按钮 -->
      <button v-if="canGoPrev" class="nav-btn prev-btn" @click.stop="goPrev">
        ‹
      </button>
      <button v-if="canGoNext" class="nav-btn next-btn" @click.stop="goNext">
        ›
      </button>

      <!-- 旋转按钮 -->
      <button class="rotate-btn" @click.stop="handleRotate" title="旋转图片">
        ↻
      </button>

      <!-- 图片显示区域 -->
      <div
        class="image-container"
        @wheel.stop="handleWheel"
        @touchstart="handleTouchStart"
        @touchmove="handleTouchMove"
        @touchend="handleTouchEnd"
      >
        <img
          ref="imageRef"
          :src="currentImage?.url"
          :alt="`${currentImage?.time} DAYS ${currentImage?.days} PAGE ${
            currentImage?.localIndex + 1
          } `"
          class="preview-image"
          @load="handleImageLoad"
          @error="handleImageError"
          :style="imageStyle"
          draggable="false"
        />
      </div>

      <!-- 图片信息 -->
      <div class="image-info">
        <span v-if="currentImage">
          {{ currentImage.time }} DAYS {{ currentImage.days }} PAGE
          {{ currentImage.localIndex + 1 }}
        </span>
      </div>

      <!-- 缩略图导航 -->
      <div
        v-if="showThumbnails && totalImages > 1"
        class="thumbnails-container"
        @wheel.stop="handleThumbnailWheel"
      >
        <div
          v-for="(image, index) in filterImage"
          :key="index"
          class="thumbnail"
          :class="{ active: index === currentIndex }"
          @click.stop="goToImage(index)"
        >
          <img :src="image.url" :alt="`DAYS ${image.days}`" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from "vue";
import { loadImage, isImageLoaded, markImageAsLoaded } from "../utils/imageLoader";

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  images: {
    type: Array,
    default: () => [],
  },
  initialIndex: {
    type: Number,
    default: 0,
  },
  showThumbnails: {
    type: Boolean,
    default: true,
  },
});

const emit = defineEmits(["update:visible", "change", "close"]);

const currentIndex = ref(props.initialIndex);
const imageRef = ref(null);
const scale = ref(1);
const translateX = ref(0);
const translateY = ref(0);
const rotation = ref(0);
const isDragging = ref(false);
const dragStartX = ref(0);
const dragStartY = ref(0);
const lastTranslateX = ref(0);
const lastTranslateY = ref(0);

const filterImage = computed(() => props.images.filter((o) => !!o.url));
console.log("filterImage", filterImage.value);
const currentImage = computed(() => filterImage.value[currentIndex.value]);
const totalImages = computed(() => filterImage.value.length);
const canGoPrev = computed(() => currentIndex.value > 0);
const canGoNext = computed(
  () => currentIndex.value < filterImage.value.length - 1
);

const imageStyle = computed(() => ({
  transform: `rotate(${rotation.value}deg) scale(${scale.value}) translate(${translateX.value}px, ${translateY.value}px)`,
  transition: isDragging.value ? "none" : "transform 0.3s ease",
  cursor: scale.value > 1 ? "move" : "default",
}));

// 监听 visible 变化
watch(
  () => props.visible,
  (newVal) => {
    if (newVal) {
      currentIndex.value = props.initialIndex;
      resetTransform();
      document.body.style.overflow = "hidden";
      // 打开预览时预加载相邻图片
      nextTick(() => {
        preloadAdjacentImages();
      });
    } else {
      document.body.style.overflow = "";
    }
  }
);

// 监听索引变化
watch(currentIndex, (newIndex, oldIndex) => {
  if (newIndex !== oldIndex) {
    emit("change", newIndex, oldIndex);
    resetTransform();
    // 预加载相邻图片
    preloadAdjacentImages();
  }
});

const resetTransform = () => {
  scale.value = 1;
  translateX.value = 0;
  translateY.value = 0;
  rotation.value = 0;
  lastTranslateX.value = 0;
  lastTranslateY.value = 0;
};

const close = () => {
  emit("update:visible", false);
  emit("close");
};

const handleOverlayClick = (event) => {
  if (event.target === event.currentTarget) {
    close();
  }
};

const goPrev = () => {
  if (canGoPrev.value) {
    currentIndex.value--;
  }
};

const goNext = () => {
  if (canGoNext.value) {
    currentIndex.value++;
  }
};

const goToImage = (index) => {
  currentIndex.value = index;
};

const handleRotate = () => {
  rotation.value = (rotation.value + 90) % 360;
};

const handleWheel = (event) => {
  event.preventDefault();
  const delta = event.deltaY > 0 ? 0.9 : 1.1;
  const newScale = Math.min(Math.max(scale.value * delta, 0.5), 3);

  if (newScale !== scale.value) {
    scale.value = newScale;

    // 如果缩放到1，重置位置
    if (scale.value === 1) {
      translateX.value = 0;
      translateY.value = 0;
    }
  }
};

const handleImageLoad = () => {
  console.log(`图片加载成功: ${currentImage.value?.url}`);
  // 标记图片为已加载，加入缓存
  if (currentImage.value?.url) {
    markImageAsLoaded(currentImage.value.url);
  }
};

const handleImageError = () => {
  console.error(`图片加载失败: ${currentImage.value?.url}`);
};

// 预加载相邻图片
const preloadAdjacentImages = async () => {
  const urls = [];
  
  // 预加载前一张
  if (currentIndex.value > 0) {
    const prevUrl = filterImage.value[currentIndex.value - 1]?.url;
    if (prevUrl && !isImageLoaded(prevUrl)) {
      urls.push(prevUrl);
    }
  }
  
  // 预加载后一张
  if (currentIndex.value < filterImage.value.length - 1) {
    const nextUrl = filterImage.value[currentIndex.value + 1]?.url;
    if (nextUrl && !isImageLoaded(nextUrl)) {
      urls.push(nextUrl);
    }
  }
  
  // 后台预加载
  urls.forEach(url => loadImage(url).catch(() => {}));
};

// 处理缩略图容器的滚轮事件
const handleThumbnailWheel = (event) => {
  event.preventDefault();
  event.stopPropagation();

  const container = event.currentTarget;
  const scrollAmount = event.deltaY > 0 ? 100 : -100;

  container.scrollLeft += scrollAmount;
};

// 鼠标拖拽功能
const handleMouseDown = (event) => {
  if (scale.value <= 1) return;

  isDragging.value = true;
  dragStartX.value = event.clientX;
  dragStartY.value = event.clientY;
  lastTranslateX.value = translateX.value;
  lastTranslateY.value = translateY.value;
};

const handleMouseMove = (event) => {
  if (!isDragging.value || scale.value <= 1) return;

  const deltaX = event.clientX - dragStartX.value;
  const deltaY = event.clientY - dragStartY.value;

  translateX.value = lastTranslateX.value + deltaX;
  translateY.value = lastTranslateY.value + deltaY;
};

const handleMouseUp = () => {
  isDragging.value = false;
};

// 键盘事件
const handleKeydown = (event) => {
  if (!props.visible) return;

  switch (event.key) {
    case "Escape":
      close();
      break;
    case "ArrowLeft":
      goPrev();
      break;
    case "ArrowRight":
      goNext();
      break;
  }
};

// 触摸事件处理
let touchStartDistance = 0;
let touchStartScale = 1;
let initialPinchDistance = 0;

const handleTouchStart = (event) => {
  if (event.touches.length === 2) {
    // 双指缩放开始
    isDragging.value = false;
    const dx = event.touches[0].clientX - event.touches[1].clientX;
    const dy = event.touches[0].clientY - event.touches[1].clientY;
    initialPinchDistance = Math.sqrt(dx * dx + dy * dy);
    touchStartScale = scale.value;
  } else if (event.touches.length === 1) {
    // 单指拖拽开始
    if (scale.value > 1) {
      isDragging.value = true;
      dragStartX.value = event.touches[0].clientX;
      dragStartY.value = event.touches[0].clientY;
      lastTranslateX.value = translateX.value;
      lastTranslateY.value = translateY.value;
    }
  }
};

const handleTouchMove = (event) => {
  if (event.touches.length === 2) {
    // 双指缩放
    event.preventDefault();
    const dx = event.touches[0].clientX - event.touches[1].clientX;
    const dy = event.touches[0].clientY - event.touches[1].clientY;
    const currentDistance = Math.sqrt(dx * dx + dy * dy);

    if (initialPinchDistance > 0) {
      const scaleRatio = currentDistance / initialPinchDistance;
      const newScale = Math.min(Math.max(touchStartScale * scaleRatio, 0.5), 3);
      scale.value = newScale;
    }
  } else if (event.touches.length === 1 && isDragging.value) {
    // 单指拖拽
    event.preventDefault();
    const deltaX = event.touches[0].clientX - dragStartX.value;
    const deltaY = event.touches[0].clientY - dragStartY.value;
    translateX.value = lastTranslateX.value + deltaX;
    translateY.value = lastTranslateY.value + deltaY;
  }
};

const handleTouchEnd = () => {
  isDragging.value = false;
  initialPinchDistance = 0;
};

onMounted(() => {
  document.addEventListener("keydown", handleKeydown);
  document.addEventListener("mousemove", handleMouseMove);
  document.addEventListener("mouseup", handleMouseUp);

  // 为图片添加鼠标事件监听
  if (imageRef.value) {
    imageRef.value.addEventListener("mousedown", handleMouseDown);
  }
});

onUnmounted(() => {
  document.removeEventListener("keydown", handleKeydown);
  document.removeEventListener("mousemove", handleMouseMove);
  document.removeEventListener("mouseup", handleMouseUp);
  document.body.style.overflow = "";
});
</script>

<style scoped>
/* 按钮重置样式 */
button {
  outline: none;
  border: none;
  background: transparent;
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  box-shadow: none;
  -webkit-focus-ring-color: transparent;
  -webkit-tap-highlight-color: transparent;
}

button:focus {
  outline: none;
  box-shadow: none;
  border: none;
  -webkit-focus-ring-color: transparent;
}

button:active {
  outline: none;
  box-shadow: none;
  border: none;
  -webkit-focus-ring-color: transparent;
}

button:focus-visible {
  outline: none;
  box-shadow: none;
  border: none;
}

.image-preview-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.9);
  z-index: 9999;
  display: flex;
  justify-content: center;
  align-items: center;
  user-select: none;
}

.preview-container {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.close-btn {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 40px;
  height: 40px;
  border: none;
  color: white;
  font-size: 24px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  background: transparent;
  border: 0;
  z-index: 10;
  transform: rotate(0deg);
  outline: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
}

.close-btn:hover {
  transform: rotate(90deg);
  transition: 0.4s;
}

.close-btn:focus,
.close-btn:focus-visible {
  outline: none;
  box-shadow: none;
  border: none;
  -webkit-focus-ring-color: transparent;
}

.nav-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 50px;
  height: 50px;
  border: none;
  background: transparent;
  border: 0;
  color: #0048ff;
  font-size: min(10vw, 50px);
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10;
  outline: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
}

.nav-btn:hover {
}

.nav-btn:focus,
.nav-btn:focus-visible {
  outline: none;
  box-shadow: none;
  border: none;
  -webkit-focus-ring-color: transparent;
}

.prev-btn {
  left: 20px;
}

.next-btn {
  right: 20px;
}

.rotate-btn {
  position: absolute;
  top: 20px;
  right: 70px;
  width: 40px;
  height: 40px;
  border: none;
  background: transparent;
  color: white;
  font-size: 20px;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  border: 0;
  z-index: 10;
  transform: rotate(0deg);
  outline: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
}

.rotate-btn:hover {
  transform: rotate(90deg);
  transition: 0.4s;
}

.rotate-btn:focus,
.rotate-btn:focus-visible {
  outline: none;
  box-shadow: none;
  border: none;
  -webkit-focus-ring-color: transparent;
}

.image-container {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
  width: 100%;
  height: 100%;
  touch-action: none; /* 禁用默认触摸行为，确保自定义手势生效 */
}

.preview-image {
  max-width: 90%;
  max-height: 90%;
  object-fit: contain;
  transform-origin: center;
}

.image-info {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  color: white;
  background: rgba(0, 0, 0, 0.5);
  padding: 10px 20px;
  border-radius: 20px;
  font-size: 14px;
  z-index: 10;
}

.thumbnails-container {
  position: absolute;
  bottom: 80px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 10px;
  max-width: 80%;
  overflow-x: auto;
  overflow-y: hidden;
  padding: 10px;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 10px;
  z-index: 10;
  scroll-behavior: smooth;
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE and Edge */
}

.thumbnail {
  width: 50px;
  height: 50px;
  border: 2px solid transparent;
  border-radius: 4px;
  cursor: pointer;
  overflow: hidden;
  flex-shrink: 0;
  transition: border-color 0.3s;
}

.thumbnail.active {
  border-color: #1890ff;
}

.thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* 隐藏所有浏览器的滚动条 */
.thumbnails-container::-webkit-scrollbar {
  display: none; /* Chrome, Safari, Edge */
}

/* PC端优化 */
@media (min-width: 769px) {
  .thumbnails-container {
    max-width: 90%;
    padding: 12px;
    gap: 12px;
    cursor: grab;
  }

  .thumbnails-container:active {
    cursor: grabbing;
  }

  .thumbnail {
    width: 60px;
    height: 60px;
  }

  .thumbnail:hover {
    transform: scale(1.1);
    transition: transform 0.2s ease;
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .close-btn {
    width: 35px;
    height: 35px;
    font-size: 20px;
    top: 10px;
    right: 10px;
  }

  .nav-btn {
    width: 40px;
    height: 40px;
    font-size: min(10vw, 50px);
  }

  .prev-btn {
    left: 10px;
  }

  .next-btn {
    right: 10px;
  }

  .rotate-btn {
    width: 35px;
    height: 35px;
    font-size: 16px;
    top: 10px;
    right: 50px;
  }

  .image-info {
    font-size: 12px;
    padding: 8px 16px;
    bottom: 10px;
  }

  .thumbnails-container {
    bottom: 60px;
    gap: 8px;
    padding: 8px;
  }

  .thumbnail {
    width: 40px;
    height: 40px;
  }
}
</style>
