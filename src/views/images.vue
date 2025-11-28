<template>
  <div
    class="scroll-page page-images"
    @wheel="handleWheel"
    @scroll="handleScroll"
    @touchstart="handleTouchStart"
    @touchmove="handleTouchMove"
    ref="scrollContainer"
  >
    <div class="content">
      <div class="center-line-vertical"></div>
      <div class="center-line-vertical2"></div>
      <div
        class="center-line-image"
        :style="{
          transform: `translate(50%, -50%) rotate(${imageRotation}deg)`,
        }"
      >
        <img
          src="../assets/round_1.svg"
          alt=""
          :style="{
            filter: getImageFilter(imageRotation),
            opacity: getImageOpacity(imageRotation),
          }"
        />
      </div>
      <div
        class="center-line-horizontal"
        :style="horizontalLineStyle"
        :class="{ 'mobile-fixed': isMobile }"
      >
        <div class="center-line-horizontal-content"></div>
        <div class="center-line-horizontal-content2"></div>
        <div class="center-line-horizontal-days">
          {{ currentBehindContent?.days || "" }}
        </div>
        <div class="center-line-horizontal-info">
          <div class="center-line-horizontal-info-title">
            ISEKAIJOUCHO 6TH COUNTDOWN
          </div>
          <div class="center-line-horizontal-info-name">
            {{ currentBehindContent?.name || "" }}
          </div>
        </div>
      </div>
      <section v-for="(item, index) in image_list" :key="index">
        <div
          class="content-images"
          v-for="(image, i_index) in item.children"
          :key="item.days + i_index"
        >
          <div class="left-content">
            <div class="left-content_boxs cursor-target">
              <div class="left-content_days">
                <span
                  :style="{
                    color: isImageActive(item.days, i_index)
                      ? '#aaa'
                      : '#141414',
                  }"
                  >DAYS {{ item.days }}</span
                >
              </div>
              <div
                class="left-content_time"
                :style="{
                  color: isImageActive(item.days, i_index) ? '#aaa' : '#141414',
                }"
              >
                {{ item.time }}
              </div>
            </div>
          </div>
          <div class="right-content">
            <div class="right-content_item">
              <div
                class="image-container"
                :style="
                  image.loadError || !image.url || image.isLoading
                    ? { width: '100%' }
                    : {}
                "
              >
                <!-- 加载中状态 - 图片还不应该加载或正在加载中时显示 -->
                <div
                  v-if="
                    image.url &&
                    !image.loadError &&
                    (!shouldLoadImage(image, item.days, i_index) ||
                      !isImageReady(image.url))
                  "
                  class="image-loading-placeholder"
                >
                  <div class="loading-spinner"></div>
                  <span class="loading-text">LOADING</span>
                </div>
                <!-- 隐藏的img用于实际加载图片 -->
                <img
                  v-if="image.url && shouldLoadImage(image, item.days, i_index)"
                  class="right-content_item-image cursor-target"
                  :class="{ 'image-hidden': !isImageReady(image.url) }"
                  alt="图像"
                  draggable="false"
                  :src="image.url"
                  @click="showImages(item.days, i_index)"
                  @load="handleImageLoad"
                  @error="handleImageError"
                />
                <!-- 加载失败状态 -->
                <div
                  v-if="image.url && image.loadError"
                  class="image-error-placeholder"
                >
                  <span class="error-text">ERROR</span>
                </div>
                <!-- 无URL状态 -->
                <div v-if="!image.url" class="image-error-placeholder">
                  <span class="none-text">?</span>
                </div>
                <div
                  class="image-covered"
                  :class="{
                    active: isImageActive(item.days, i_index),
                    inactive:
                      !isImageActive(item.days, i_index) &&
                      wasImageActive(item.days, i_index),
                  }"
                >
                  <div class="covered-gradient"></div>
                  <div class="covered-gradient covered-gradient-2"></div>
                  <div class="covered-circle"></div>
                  <div class="covered-line"></div>
                  <div class="covered-line covered-line-2"></div>
                </div>
                <div
                  class="image-overlay"
                  :class="{
                    active: isImageActive(item.days, i_index),
                    inactive:
                      !isImageActive(item.days, i_index) &&
                      wasImageActive(item.days, i_index),
                  }"
                >
                  <div class="overlay-gradient"></div>
                  <div class="overlay-text">{{ item.time }}</div>
                </div>
                <div class="image-container-info">
                  <div class="image-container-info_left cursor-target">
                    <div class="image-container-info_left-name">
                      {{ image.name }}
                    </div>
                    <div class="image-container-info_left-x_name">
                      {{ image.account_X ? "@" + image.account_X : "" }}
                    </div>
                  </div>
                  <div
                    class="image-container-info_right"
                    :class="{
                      active: isImageActive(item.days, i_index),
                      inactive:
                        !isImageActive(item.days, i_index) &&
                        wasImageActive(item.days, i_index),
                    }"
                  >
                    <div
                      v-if="image.link_X && image.link_X.trim()"
                      class="link link_X"
                      @click="linkOpen(image.link_X)"
                    >
                      <img src="../assets/X.svg" alt="" />
                    </div>
                    <div
                      v-if="image.link_bili && image.link_bili.trim()"
                      class="link link_bili"
                      @click="linkOpen(image.link_bili)"
                    >
                      <img src="../assets/Bilibili.svg" alt="" />
                    </div>
                    <div
                      v-if="image.link_weibo && image.link_weibo.trim()"
                      class="link link_weibo"
                      @click="linkOpen(image.link_weibo)"
                    >
                      <img src="../assets/Weibo.svg" alt="" />
                    </div>
                    <div
                      v-if="image.link_red && image.link_red.trim()"
                      class="link link_red"
                      @click="linkOpen(image.link_red)"
                    >
                      <img src="../assets/Rednote.svg" alt="" />
                    </div>
                    <div
                      v-if="image.link_lof && image.link_lof.trim()"
                      class="link link_lof"
                      @click="linkOpen(image.link_lof)"
                    >
                      <img src="../assets/Lofter.svg" alt="" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer class="page-footer">
        <div class="footer-item">
          <div class="footer-item_title">ORGANIZER</div>
          <div class="footer-item_names">
            <div
              class="footer-item_name"
              @click="linkOpen('https://x.com/shadowyuzu1')"
            >
              天弓弦 @shadowyuzu1
            </div>
            <div
              class="footer-item_name"
              @click="linkOpen('https://x.com/AbyssiTanuki')"
            >
              深海狸 @AbyssiTanuki
            </div>
          </div>
        </div>
        <div class="footer-item">
          <div class="footer-item_title">DESIGNER/DEVELOPER</div>
          <div class="footer-item_names">
            <div
              class="footer-item_name"
              @click="linkOpen('https://x.com/hua_ji_mc')"
            >
              芦花鸡 @hua_ji_mc
            </div>
            <div
              class="footer-item_name"
              @click="linkOpen('https://x.com/shisheng00')"
            >
              ShiSheng / 10L @shisheng00
            </div>
          </div>
        </div>
        <div class="footer-item">
          <div class="footer-item_title">ILLUSTRATOR</div>
          <div class="footer-item_names">
            <div
              v-for="(image, index) in nameList"
              :key="'ill' + index"
              class="footer-item_name"
              :class="{
                noclick: !image.account_X,
              }"
              @click="
                linkOpen(
                  image.account_X ? `https://x.com/${image.account_X}` : ''
                )
              "
            >
              {{ image.name }}
              {{ image.account_X ? `@${image.account_X}` : "" }}
            </div>
          </div>
        </div>
      </footer>

      <TargetCursor 
        :spinDuration="5"
        :hoverDuration="0.5"
        :hideDefaultCursor="true"
        :parallaxOn="true"
        targetSelector=".cursor-target"
      />

      <!-- 图片预览组件 -->
      <ImagesPreview
        v-model:visible="visible"
        :images="allImages"
        :initial-index="currentImageIndex"
        @change="handlePreviewChange"
        @close="handlePreviewClose"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, computed, nextTick } from "vue";
import { IMAGES } from "../utils/default";
import ImagesPreview from "../components/imagesPreview.vue";
import TargetCursor from "../components/TargetCursor.vue";
import {
  preloadImages,
  isImageLoaded,
  markImageAsLoaded,
  getLoadedImages,
} from "../utils/imageLoader";

const scrollContainer = ref(null);
const isAtTop = ref(true);
const isAtBottom = ref(false);
const visible = ref(false);
const currentImageIndex = ref(0);
const currentDays = ref(null);

const image_list = IMAGES;

// 懒加载相关
const PRELOAD_COUNT = 3; // 预加载前后各3张图片
const INITIAL_LOAD_COUNT = 5; // 初始加载前5张图片
const loadedImagesSet = getLoadedImages(); // 响应式的已加载图片集合

// 将所有图片扁平化为数组，方便预览
const allImages = ref([]);
const imageMap = ref(new Map());
const nameList = ref([]);

// 中心线相关状态
const horizontalLinePosition = ref(50); // 默认在50vh位置
const currentBehindSection = ref(null); // 当前线段所在的content-images索引
const currentBehindContent = ref(null); // 当前鼠标位置下的content-images对象
const isMobile = ref(false); // 是否为移动端

// 动画状态管理
const previousActiveImage = ref(null); // 上一个激活的图片
const activeImageSet = ref(new Set()); // 当前激活的图片集合

// 中心线图片旋转相关
const previousCountIndex = ref(null); // 上一个countIndex
const imageRotation = ref(0); // 当前旋转角度
const rotationDeg = ref(50);

// 计算图片滤镜颜色
const getImageFilter = (rotation) => {
  const maxDeg = rotationDeg.value * allImages.value.length;
  // 计算颜色插值比例（逆时针旋转时从 #505050 到 #002FA7）
  // 0度 = #505050, 360度 = #002FA7
  const progress = Math.abs(rotation) / maxDeg;
  // return 'invert(11%) sepia(92%) saturate(4161%) hue-rotate(224deg) brightness(96%) contrast(104%)';

  if (progress === 0) {
    // #505050
    // return 'invert(32%) sepia(4%) saturate(15%) hue-rotate(20deg) brightness(91%) contrast(91%)';
    // 01000F
    return "invert(3%) sepia(65%) saturate(2013%) hue-rotate(234deg) brightness(85%) contrast(110%);";
  } else if (progress === 1) {
    // #002FA7 - 使用蓝色滤镜
    return "invert(11%) sepia(92%) saturate(4161%) hue-rotate(224deg) brightness(96%) contrast(104%)";
  } else {
    // 中间状态：线性插值计算各个参数
    const invert = 3 * (1 - progress) + 11 * progress;
    const sepia = 65 * (1 - progress) + 92 * progress;
    const saturate = 2013 * (1 - progress) + 4161 * progress;
    const hueRotate = 234 * (1 - progress) + 224 * progress;
    const brightness = 85 * (1 - progress) + 96 * progress;
    const contrast = 110 * (1 - progress) + 104 * progress;

    return `invert(${invert}%) sepia(${sepia}%) saturate(${saturate}%) hue-rotate(${hueRotate}deg) brightness(${brightness}%) contrast(${contrast}%)`;
  }
};

// 计算图片透明度
const getImageOpacity = (rotation) => {
  const maxDeg = rotationDeg.value * allImages.value.length;
  const progress = Math.abs(rotation) / maxDeg;

  if (progress === 0) {
    return 0.3;
  } else if (progress === 1) {
    // #002FA7 - 使用蓝色滤镜
    return 1;
  } else {
    // 中间状态：线性插值计算各个参数
    const opacity = 0.3 * (1 - progress) + 1 * progress;

    return opacity;
  }
};

// content-images元素引用
const sectionElements = ref([]);

// 用于收集元素的函数
const setSectionElement = (el) => {
  if (el) {
    // 清空数组重新收集，确保顺序正确
    sectionElements.value = [];
  }
};

// 使用 watch 来监听数据变化，重新收集元素
watch(
  () => image_list,
  () => {
    nextTick(() => {
      // 通过 DOM 查询来收集所有 content-images 元素
      const elements = document.querySelectorAll(".content-images");
      sectionElements.value = Array.from(elements);
      console.log(
        "通过查询收集到的 content-images 元素数量:",
        sectionElements.value.length
      );
    });
  },
  { immediate: true }
);

// 处理图片加载成功
const handleImageLoad = (event) => {
  const img = event.target;
  // 找到对应的图片数据并设置加载完成状态
  const imgSrc = img.src;

  // 标记图片已加载到共享管理器
  markImageAsLoaded(imgSrc);

  // 遍历图片数据找到对应的图片
  image_list.forEach((item) => {
    item.children.forEach((image) => {
      if (image.url && imgSrc.includes(image.url.split("/").pop())) {
        image.isLoading = false;
        image.loadError = false;
      }
    });
  });
};

// 处理图片加载错误
const handleImageError = (event) => {
  const img = event.target;
  // 找到对应的图片数据并设置错误状态
  const imgSrc = img.src;

  // 遍历图片数据找到对应的图片
  image_list.forEach((item) => {
    item.children.forEach((image) => {
      if (image.url && imgSrc.includes(image.url.split("/").pop())) {
        image.isLoading = false;
        image.loadError = true;
      }
    });
  });

  img.style.display = "none";
};

// 初始化图片数据
const initializeImages = () => {
  const images = [];
  nameList.value = [];
  const map = new Map();
  let globalIndex = 0;

  image_list.forEach((item) => {
    item.children.forEach((image, localIndex) => {
      const imageInfo = {
        ...image,
        days: item.days,
        time: item.time,
        localIndex,
        globalIndex,
        loadError: false, // 初始化错误状态
        isLoading: true, // 初始化加载状态
      };
      image.loadError = false; // 初始化错误状态
      image.isLoading = true; // 进入加载状态
      images.push(imageInfo);
      if (!nameList.value.find((o) => o.name === imageInfo.name)) {
        nameList.value.push(imageInfo);
      }
      map.set(`${item.days}-${localIndex}`, globalIndex);
      globalIndex++;
    });
  });

  allImages.value = images;
  imageMap.value = map;
  console.log("allImages", allImages.value);
};

const emit = defineEmits(["scroll-state", "preview-state"]);
const props = defineProps(["state"]);

const handleWheel = (event) => {
  // 如果在 B 页面且不在顶部，允许 B 页面自己滚动
  // console.log("event", event);
  // console.log("props", props.state);
  if (props.state.isAtTop && event.deltaY < -50) {
    // 已到达顶部并向上滑动
  } else {
    event.stopPropagation();
  }
};

// B 页面自己的触摸事件处理
const handleTouchStart = (event) => {
  // 允许事件继续传播，但标记正在触摸
  event.stopPropagation();
};

const handleTouchMove = (event) => {
  // 允许触摸滚动，不阻止事件
  event.stopPropagation();
};

const handleScroll = () => {
  if (!scrollContainer.value) return;

  const { scrollTop, scrollHeight, clientHeight } = scrollContainer.value;

  // 检查是否在顶部（增加一些容差）
  isAtTop.value = scrollTop <= 100;

  // 检查是否在底部
  isAtBottom.value = scrollTop + clientHeight >= scrollHeight - 10;

  // 通知父组件滚动状态
  emit("scroll-state", {
    isAtTop: isAtTop.value,
    isAtBottom: isAtBottom.value,
    canScroll: scrollHeight > clientHeight,
  });

  // 根据设备类型更新currentBehindContent
  if (isMobile.value) {
    // 移动端：使用屏幕中心位置
    updateBehindSectionForMobile();
  } else {
    // PC端：使用当前水平线位置
    const currentLineY =
      (horizontalLinePosition.value / 100) * window.innerHeight;
    updateBehindSection(currentLineY);
  }
};

const showImages = (days, index) => {
  const key = `${days}-${index}`;
  currentImageIndex.value = imageMap.value.get(key);
  currentDays.value = days;
  visible.value = true;
  console.log(
    `打开预览：第 ${days} 天，第 ${index + 1} 张图片，全局索引 ${
      currentImageIndex.value
    }`
  );

  // 通知父组件预览状态变化
  emit("preview-state", { isPreviewOpen: true });
};

const handlePreviewClose = () => {
  console.log("关闭预览");
  // 通知父组件预览状态变化
  emit("preview-state", { isPreviewOpen: false });
};

const handlePreviewChange = (current, prev) => {
  const currentImage = allImages.value[current];
  if (currentImage) {
    console.log(
      `切换到：第 ${currentImage.days} 天，第 ${
        currentImage.localIndex + 1
      } 张图片，全局索引 ${current}`
    );
    currentImageIndex.value = current;
  }
};

// 检测是否为移动端
const checkIsMobile = () => {
  isMobile.value =
    window.innerWidth <= 768 ||
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
};

// 处理鼠标移动事件
const handleMouseMove = (event) => {
  if (isMobile.value) return;

  const mouseY = event.clientY;
  const viewportHeight = window.innerHeight;
  const percentage = (mouseY / viewportHeight) * 100;
  horizontalLinePosition.value = percentage;

  // 检测线段位于哪个content-images后面
  updateBehindSection(mouseY);
};

// 更新线段所在的section
const updateBehindSection = (mouseY) => {
  currentBehindSection.value = null;
  currentBehindContent.value = null;

  if (!sectionElements.value || !Array.isArray(sectionElements.value)) return;

  for (let i = 0; i < sectionElements.value.length; i++) {
    const element = sectionElements.value[i];
    if (!element) continue;

    const rect = element.getBoundingClientRect();
    if (mouseY >= rect.top && mouseY <= rect.bottom) {
      currentBehindSection.value = i;
      currentBehindContent.value = allImages.value[i] || null;
      break;
    }
  }
};

// 移动端滚动时更新线段所在的section
const updateBehindSectionForMobile = () => {
  currentBehindSection.value = null;
  currentBehindContent.value = null;

  if (!sectionElements.value || !Array.isArray(sectionElements.value)) return;

  // 移动端使用屏幕中心位置作为检测点
  const screenCenterY = window.innerHeight / 2;

  for (let i = 0; i < sectionElements.value.length; i++) {
    const element = sectionElements.value[i];
    if (!element) continue;

    const rect = element.getBoundingClientRect();
    if (screenCenterY >= rect.top && screenCenterY <= rect.bottom) {
      currentBehindSection.value = i;
      currentBehindContent.value = allImages.value[i] || null;
      break;
    }
  }
};

// 判断图片是否当前激活
const isImageActive = (days, imageIndex) => {
  if (
    !currentBehindContent.value ||
    typeof currentBehindContent.value !== "object"
  )
    return false;
  return (
    currentBehindContent.value.days === days &&
    currentBehindContent.value.localIndex === imageIndex
  );
};

// 判断图片是否之前激活过（用于退出动画）
const wasImageActive = (days, imageIndex) => {
  const imageKey = `${days}-${imageIndex}`;
  return previousActiveImage.value === imageKey;
};

const linkOpen = (url) => {
  // 检查URL是否存在且不为空
  if (url && url.trim() !== "") {
    window.open(url, "_blank");
  } else {
    console.log("链接为空，无法打开");
    // 可选：显示用户友好的提示
    // alert("该链接暂未提供");
  }
};

// 判断图片是否应该加载（懒加载逻辑）
const shouldLoadImage = (image, days, imageIndex) => {
  const key = `${days}-${imageIndex}`;
  const globalIndex = imageMap.value.get(key);

  if (globalIndex === undefined) return false;

  // 检查图片URL是否已加载
  if (image && image.url && loadedImagesSet.has(image.url)) {
    return true;
  }

  // 检查是否在初始加载范围内
  if (globalIndex < INITIAL_LOAD_COUNT) {
    return true;
  }

  // 检查是否在当前可见区域附近（当前激活图片的前后PRELOAD_COUNT张）
  const currentIndex = currentBehindSection.value;
  if (currentIndex !== null && currentIndex !== undefined) {
    const startIndex = Math.max(0, currentIndex - PRELOAD_COUNT);
    const endIndex = Math.min(
      allImages.value.length - 1,
      currentIndex + PRELOAD_COUNT
    );
    if (globalIndex >= startIndex && globalIndex <= endIndex) {
      return true;
    }
  }

  return false;
};

// 判断图片是否已经加载完成（用于显示loading状态）
const isImageReady = (url) => {
  if (!url) return false;
  return loadedImagesSet.has(url);
};

// 预加载周围的图片
const preloadNearbyImages = async () => {
  const currentIndex = currentBehindSection.value;
  if (currentIndex === null) return;

  const startIndex = Math.max(0, currentIndex - PRELOAD_COUNT);
  const endIndex = Math.min(
    allImages.value.length - 1,
    currentIndex + PRELOAD_COUNT
  );

  const urlsToPreload = [];
  for (let i = startIndex; i <= endIndex; i++) {
    const image = allImages.value[i];
    if (image && image.url && !isImageLoaded(image.url)) {
      urlsToPreload.push(image.url);
    }
  }

  if (urlsToPreload.length > 0) {
    await preloadImages(urlsToPreload);
  }
};

// 监听currentBehindContent变化，更新动画状态
watch(
  () => currentBehindContent.value,
  (newContent, oldContent) => {
    const newKey =
      newContent && newContent.days
        ? `${newContent.days}-${newContent.localIndex}`
        : null;
    const oldKey =
      oldContent && oldContent.days
        ? `${oldContent.days}-${oldContent.localIndex}`
        : null;

    // 更新上一个激活的图片
    previousActiveImage.value = oldKey;

    // 处理图片旋转
    const newCountIndex = newContent?.globalIndex ?? null;
    const oldCountIndex = previousCountIndex.value;

    if (
      newCountIndex !== null &&
      oldCountIndex !== null &&
      newCountIndex !== oldCountIndex
    ) {
      // 计算旋转角度变化
      const indexDiff = newCountIndex - oldCountIndex;

      if (indexDiff > 0) {
        // countIndex增加，逆时针旋转
        imageRotation.value -= rotationDeg.value; // 每次旋转30度
      } else if (indexDiff < 0) {
        // countIndex减少，顺时针旋转
        imageRotation.value += rotationDeg.value; // 每次旋转30度
      }
    }

    // 更新上一次的countIndex
    previousCountIndex.value = newCountIndex;

    // 预加载附近的图片
    preloadNearbyImages();
  },
  { deep: true }
);

// 计算水平线的样式
const horizontalLineStyle = computed(() => {
  if (isMobile.value) {
    return {
      top: "50vh",
      width: "100vw",
    };
  } else {
    return {
      top: `${horizontalLinePosition.value}vh`,
      width: "100vw",
    };
  }
});

// 初始化时检查状态
onMounted(() => {
  handleScroll();

  // 初始化图片数据
  initializeImages();

  // 检测移动端
  checkIsMobile();

  // 初始化sectionElements数组
  sectionElements.value = [];

  // 添加鼠标移动监听
  window.addEventListener("mousemove", handleMouseMove);
  window.addEventListener("resize", checkIsMobile);

  // 确保容器可以滚动
  if (scrollContainer.value) {
    scrollContainer.value.style.overflowY = "auto";
  }

  // 延迟检查元素是否正确收集
  nextTick(() => {
    console.log(
      "sectionElements 收集到的元素数量:",
      sectionElements.value.length
    );
    console.log("sectionElements:", sectionElements.value);

    // 初始化时更新位置
    currentBehindSection.value = 0;
    currentBehindContent.value = allImages.value[0];

    // 预加载初始图片（前INITIAL_LOAD_COUNT张 + 周围的图片）
    const initialUrls = allImages.value
      .slice(0, INITIAL_LOAD_COUNT + PRELOAD_COUNT)
      .filter((img) => img.url)
      .map((img) => img.url);
    preloadImages(initialUrls);
  });
});

// 清理
onUnmounted(() => {
  emit("scroll-state", {
    isAtTop: true,
    isAtBottom: true,
    canScroll: false,
  });

  // 移除事件监听
  window.removeEventListener("mousemove", handleMouseMove);
  window.removeEventListener("resize", checkIsMobile);
});
</script>

<style scoped lang="less">
.scroll-page {
  height: 100vh;
  width: 100vw;
  overflow-y: auto; /* 确保可以滚动 */
  overflow-x: hidden;
  position: absolute;
  top: 0;
  left: 0;

  /* 改进滚动体验 */
  -webkit-overflow-scrolling: touch;
  scroll-behavior: smooth;

  /* 隐藏滚动条 */
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.scroll-page::-webkit-scrollbar {
  display: none;
}

.page-images {
  background: linear-gradient(135deg, #5a5a5a 0%, #8a8a8a 100%);
  color: #141414;
}

.content {
  min-height: 100%;
  padding: min(6vw, 30px) 0 0 0;
  position: relative;
  display: flex;
  flex-direction: column;
  .content-images {
    display: flex;
    position: relative;
    padding: min(2vw, 10px) 4vw;
    .left-content {
      width: 14vw;
      text-align: right;
      position: relative;
      .left-content_boxs {
        display: flex;
        flex-direction: row;
        height: min(5vw, 25px);
        position: absolute;
        transform-origin: top left;
        transform: rotate(90deg) translateY(-13vw);
        top: 0;
        .left-content_days {
          flex: 1;
          font-size: min(3vw, 15px);
          line-height: min(3vw, 15px);
          font-weight: bold;
          position: relative;
          white-space: nowrap;
          span {
            transition: 0.3s;
          }
        }
        .left-content_time {
          margin-left: 20px;
          flex: 1;
          font-size: min(3vw, 15px);
          line-height: min(3vw, 15px);
          font-weight: bold;
          position: relative;
          transition: 0.3s;
        }
      }
    }
    .center-content {
      width: 4vw;
    }
    .right-content {
      flex: 1;
      .right-content_item {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        margin-bottom: min(8vw, 40px);
        .image-container {
          position: relative;
          display: inline-block;
          max-width: 800px;
          border: 1px #505050 solid;

          .right-content_item-image {
            max-width: min(100%, 800px);
            max-height: min(90vh, 700px);
            display: block;
            position: relative;
            z-index: 2;

            &.image-hidden {
              position: absolute;
              width: 1px;
              height: 1px;
              opacity: 0;
              pointer-events: none;
            }
          }

          .image-error-placeholder {
            width: min(100%, 800px);
            height: min(50vh, 400px);
            background-color: #606060;
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
            z-index: 2;

            .error-text {
              color: #ffffff;
              font-size: min(8vw, 60px);
              font-weight: bold;
              opacity: 0.7;
            }
            .none-text {
              color: #ffffff;
              font-size: min(20vw, 100px);
              font-weight: bold;
              opacity: 0.7;
            }
          }

          .image-loading-placeholder {
            width: min(100%, 800px);
            height: min(50vh, 400px);
            background-color: #606060;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            position: relative;
            z-index: 2;

            .loading-spinner {
              width: min(6vw, 40px);
              height: min(6vw, 40px);
              border: 3px solid rgba(255, 255, 255, 0.3);
              border-top: 3px solid #ffffff;
              border-radius: 50%;
              animation: spin 1s linear infinite;
              margin-bottom: min(2vw, 15px);
            }

            .loading-text {
              color: #ffffff;
              font-size: min(3vw, 18px);
              font-weight: bold;
              opacity: 0.8;
              letter-spacing: 2px;
            }
          }

          @keyframes spin {
            0% {
              transform: rotate(0deg);
            }
            100% {
              transform: rotate(360deg);
            }
          }

          .image-covered {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            pointer-events: none;
            opacity: 0;
            transition: opacity 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
            z-index: 1;

            .covered-gradient {
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              background: transparent;
              width: 100%;
              height: 100%;
              border: 1px #aaa solid;
              letter-spacing: 2px;
              transform: rotate(0deg);
              transition: all 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
            }
            .covered-circle {
              position: absolute;
              top: 0;
              left: 0;
              background: transparent;
              width: min(50vw, 300px);
              height: min(50vw, 300px);
              border-radius: 100%;
              border: 1px #aaa solid;
              letter-spacing: 2px;
              transform: translate(0);
              transition: all 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
            }
            .covered-line {
              position: absolute;
              bottom: 50%;
              left: -30vw;
              background: transparent;
              width: 200vw;
              height: 0;
              border-radius: 100%;
              border: 1px #aaa solid;
              border-width: 1px 0 0 0;
              letter-spacing: 2px;
              transform-origin: center center;
              transform: translate(-20%, 0) rotate(0deg);
              transition: all 0.3s cubic-bezier(0, 0, 1, 1);
            }

            &.active {
              opacity: 1;

              .covered-gradient {
                transform: rotate(4deg);
              }
              .covered-gradient-2 {
                transform: rotate(8deg);
              }
              .covered-circle {
                transform: translate(30%, -20%);
              }
              .covered-line {
                transform: translate(-20%, 0) rotate(40deg);
              }
              .covered-line-2 {
                transform: translate(-20%, 0) rotate(-60deg);
              }
            }

            &.inactive {
              opacity: 0;
              transition-duration: 0.4s;

              .covered-gradient {
                transform: rotate(8deg);
                transition: all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
              }
              .covered-circle {
                transform: translate(0);
                transition: all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
              }
              .covered-line {
                transform: translate(-20%, 0) rotate(0deg);
                transition: all 0.8s cubic-bezier(0, 0, 1, 1);
              }
            }
          }
          .image-overlay {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            pointer-events: none;
            opacity: 0;
            transition: opacity 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
            z-index: 3;

            .overlay-gradient {
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              background: linear-gradient(
                to top,
                rgba(86, 86, 86, 0.7) 0%,
                rgba(73, 73, 73, 0.3) 20%,
                transparent 100%
              );
            }

            .overlay-text {
              position: absolute;
              bottom: min(2vw, 10px);
              left: min(2vw, 10px);
              color: #fff;
              font-size: min(3vw, 15px);
              line-height: min(3vw, 15px);
              font-weight: bold;
              letter-spacing: 2px;
              // -webkit-text-stroke: 1px rgba(255, 255, 255, 0.8);
              // text-stroke: 1px rgba(255, 255, 255, 0.8);
              opacity: 0;
              transition: opacity 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
            }

            &.active {
              opacity: 1;

              .overlay-text {
                opacity: 1;
              }
            }

            &.inactive {
              opacity: 0;
              transition-duration: 0.4s;

              .overlay-text {
                opacity: 0;
                transition: opacity 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
              }
            }
          }
        }
        & + .right-content_item {
          margin-top: min(4vw, 20px);
        }
        .image-container-info {
          position: absolute;
          bottom: max(-9.5vw, -50px);
          // margin-top: min(1.5vw, 10px);
          width: 100%;
          display: flex;
          flex-direction: row;
          z-index: 2;
          .image-container-info_left {
            text-align: left;
            .image-container-info_left-name {
              font-size: min(4vw, 20px);
              line-height: min(4vw, 20px);
              font-weight: bold;
            }
            .image-container-info_left-x_name {
              margin-top: min(1vw, 5px);
              font-size: min(3vw, 15px);
              line-height: min(3vw, 15px);
              height: min(3vw, 15px);
              font-weight: 500;
            }
          }
          .image-container-info_right {
            flex: 1;
            display: flex;
            flex-direction: row;
            justify-content: flex-end;
            align-items: center;
            max-height: min(4vw, 20px);
            background: transparent;
            opacity: 0;
            transform: translateY(-2vw);
            transition: all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
            &.active {
              opacity: 1;
              transform: translateY(0);
            }
            &.inactive {
              opacity: 0;
              transition-duration: 0.2s;
              transform: translateY(-2vw);
              transition: all 0.2s cubic-bezier(0, 0, 1, 1);
            }
            .link {
              width: min(5vw, 25px);
              height: min(5vw, 25px);
              display: flex;
              align-items: center;
              justify-content: center;
              cursor: pointer;
              & + .link {
                margin-left: min(1vw, 5px);
              }
              img {
                max-width: min(4vw, 20px);
                max-height: min(4vw, 20px);
              }
              &:hover {
                content: "";
                background: #fff;
                transition: 0.4s;
                transform: translateY(1px);
              }
            }
          }
        }
      }
    }
  }
  .center-line-vertical {
    height: 100vh;
    width: 1px;
    position: fixed;
    top: 0;
    left: 13vw;
    border: 1px solid #505050;
    border-width: 0 1px 0 0;
  }
  .center-line-vertical2 {
    height: 100vh;
    width: 1px;
    position: fixed;
    top: 0;
    right: 13vw;
    border: 1px solid #505050;
    border-width: 0 1px 0 0;
  }
  .center-line-image {
    height: 80vh;
    width: 80vh;
    position: fixed;
    top: 50vh;
    right: 13vw;
    transition: transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);

    img {
      width: 100%;
      height: 100%;
      transition: filter 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    }
  }
  .center-line-horizontal {
    height: 1px;
    position: fixed;
    left: 0;
    border: 1px solid #505050;
    border-width: 1px 0 0 0;
    pointer-events: none; // 确保不影响鼠标事件

    &.mobile-fixed {
      top: 50vh !important; // 移动端强制固定在中心
    }

    .center-line-horizontal-content {
      width: min(10vw, 100px);
      height: min(10vw, 100px);
      border-radius: min(10vw, 100px);
      position: absolute;
      top: 0;
      left: calc(13vw + 1px);
      transform: translate(-50%, -50%);
      border: 1px solid #505050;
    }

    .center-line-horizontal-content2 {
      width: min(20vw, 200px);
      height: min(20vw, 200px);
      border-radius: min(10vw, 100px);
      position: absolute;
      top: 0;
      right: 13vw;
      transform: translate(50%, -50%);
      border: 1px solid #505050;
    }

    .center-line-horizontal-days {
      position: absolute;
      top: 0;
      left: calc(13vw - 2px);
      transform: translate(-100%, -100%);
      font-size: min(5vw, 25px);
      font-weight: bold;
      color: #fff;
      text-align: right;
    }

    .center-line-horizontal-info {
      position: absolute;
      top: 0;
      left: calc(13vw - 2px);
      font-size: min(3vw, 15px);
      line-height: min(3vw, 15px);
      font-weight: bold;
      color: #fff;
      text-align: left;
      transform-origin: top left;
      transform: rotate(90deg) translate(5px, 0);
      display: flex;
      flex-direction: column;
      .center-line-horizontal-info-name {
        margin-top: 2px;
      }
    }
  }
}

.page-header {
  text-align: center;
  padding: 40px 20px;
  min-height: 60vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  position: relative;
}

.page-footer {
  margin-top: 50px;
  position: relative;
  bottom: 0;
  width: 100%;
  height: auto;
  background: #505050;
  text-align: center;
  padding: 40px min(6vw, 200px) 100px;
  opacity: 0.9;
  color: #fff;
  .footer-item {
    margin-bottom: min(4vw, 20px);
    .footer-item_title {
      text-align: left;
      font-size: min(3vw, 15px);
      line-height: min(10vw, 50px);
      font-weight: bold;
    }
    .footer-item_names {
      display: flex;
      flex-wrap: wrap;
      justify-content: flex-start;
      align-items: center;
      .footer-item_name {
        width: 100%;
        min-width: max(30vw, 300px);
        max-width: min(50vw, 400px);
        text-align: left;
        font-size: min(3vw, 15px);
        line-height: min(6vw, 30px);
        position: relative;
        cursor: pointer;

        &::after {
          content: "";
          position: absolute;
          bottom: 0;
          left: 0;
          width: 0;
          height: 1px;
          background-color: #fff;
          transition: width 0.3s ease-in-out;
        }

        &:hover::after {
          width: 50%;
        }
        &.noclick {
          cursor: default;
          &:hover::after {
            width: 0;
          }
        }
      }
    }
  }
}

.indicator {
  font-size: 2rem;
  animation: bounce 2s infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 0.7;
    transform: translateX(-50%) translateY(0);
  }
  50% {
    opacity: 1;
    transform: translateX(-50%) translateY(-5px);
  }
}

@keyframes bounce {
  0%,
  20%,
  50%,
  80%,
  100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-10px);
  }
  60% {
    transform: translateY(-5px);
  }
}
</style>
