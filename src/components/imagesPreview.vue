<template>
  <!-- 隐藏的图片画廊，用于 PhotoSwipe -->
  <div ref="galleryRef" class="pswp-gallery" style="display: none;">
    <a
      v-for="(image, index) in filterImage"
      :key="index"
      :href="image.url"
      target="_blank"
      rel="noreferrer"
    >
      <img :src="image.url" :alt="`DAYS ${image.days}`" />
    </a>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from "vue";
import PhotoSwipeLightbox from "photoswipe/lightbox";
import PhotoSwipe from "photoswipe";
import "photoswipe/style.css";
import { getCachedImage, loadImage, isImageLoaded } from "../utils/imageLoader";

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

const galleryRef = ref(null);
let lightbox = null;
let pswpInstance = null;
const currentIndex = ref(props.initialIndex);

// 过滤有效图片
const filterImage = computed(() => props.images.filter((o) => !!o.url));

// 初始化 PhotoSwipe Lightbox
const initLightbox = () => {
  if (lightbox) {
    lightbox.destroy();
    lightbox = null;
  }

  if (!galleryRef.value || filterImage.value.length === 0) return;

  lightbox = new PhotoSwipeLightbox({
    gallery: galleryRef.value,
    children: "a",
    pswpModule: PhotoSwipe,

    // 基本配置
    showHideAnimationType: "zoom",
    bgOpacity: 0.9,
    spacing: 0.1,
    allowPanToNext: true,
    loop: false,
    pinchToClose: true,
    closeOnVerticalDrag: true,

    // 缩放配置
    initialZoomLevel: "fit",
    secondaryZoomLevel: 2,
    maxZoomLevel: 4,

    // 图片尺寸配置
    imageClickAction: "zoom",
    tapAction: "zoom",
    doubleTapAction: "zoom",

    // 预加载配置
    preload: [1, 2],
    preloaderDelay: 0,

    // 自定义 padding
    paddingFn: () => {
      return { top: 30, bottom: 30, left: 0, right: 0 };
    },
  });

  // 自定义图片加载，使用缓存并获取真实尺寸
  lightbox.addFilter("itemData", (itemData, index) => {
    const image = filterImage.value[index];
    if (!image) return itemData;

    // 检查是否有缓存的图片
    const cachedImg = getCachedImage(image.url);

    // 动态获取图片尺寸 - 使用真实尺寸保持比例
    if (cachedImg && cachedImg.naturalWidth && cachedImg.naturalHeight) {
      itemData.src = image.url;
      itemData.width = cachedImg.naturalWidth;
      itemData.height = cachedImg.naturalHeight;
      itemData.msrc = image.url; // 缩略图使用相同URL，利用缓存
    } else {
      // 没有缓存或缓存没有尺寸信息，设置初始占位尺寸
      itemData.src = image.url;
      // 不设置固定尺寸，让 PhotoSwipe 自动适应
      itemData.width = 0;
      itemData.height = 0;
      itemData.msrc = image.url;
    }

    // 添加自定义数据
    itemData.alt = `${image.time} - DAYS ${image.days}`;

    return itemData;
  });

  // 图片加载完成后更新尺寸，保持正确比例
  lightbox.on("contentLoad", (e) => {
    const { content } = e;
    if (content.type === "image") {
      const img = content.element;
      if (img) {
        // 图片加载完成后获取真实尺寸
        const onLoad = () => {
          const naturalWidth = img.naturalWidth;
          const naturalHeight = img.naturalHeight;
          
          if (naturalWidth && naturalHeight) {
            // 更新 slide 数据
            content.data.width = naturalWidth;
            content.data.height = naturalHeight;
            
            // 缓存图片
            loadImage(content.data.src).catch(() => {});
            
            // 触发尺寸更新
            if (pswpInstance) {
              content.onLoaded();
            }
          }
          img.removeEventListener("load", onLoad);
        };
        
        if (img.complete && img.naturalWidth) {
          onLoad();
        } else {
          img.addEventListener("load", onLoad);
        }
      }
    }
  });

  // 自定义 DOM 内容（图片信息）
  lightbox.on("uiRegister", function () {
    // 添加自定义计数器
    lightbox.pswp.ui.registerElement({
      name: "custom-caption",
      order: 9,
      isButton: false,
      appendTo: "root",
      html: "",
      onInit: (el, pswp) => {
        pswpInstance = pswp;

        // 更新标题
        const updateCaption = () => {
          const currSlideIndex = pswp.currIndex;
          const image = filterImage.value[currSlideIndex];
          if (image) {
            el.innerHTML = `<div class="pswp-custom-caption">${image.time} - DAYS ${image.days}</div>`;
          }
        };

        pswp.on("change", updateCaption);
        updateCaption();
      },
    });
  });

  // 监听索引变化
  lightbox.on("change", () => {
    if (pswpInstance) {
      const newIndex = pswpInstance.currIndex;
      if (newIndex !== currentIndex.value) {
        const oldIndex = currentIndex.value;
        currentIndex.value = newIndex;
        emit("change", newIndex, oldIndex);
      }
    }
  });

  // 监听关闭事件
  lightbox.on("close", () => {
    emit("update:visible", false);
    emit("close");
    pswpInstance = null;
  });

  lightbox.init();
};

// 打开 lightbox 到指定索引
const openLightbox = (index) => {
  if (!lightbox) {
    initLightbox();
  }

  nextTick(() => {
    if (lightbox && galleryRef.value) {
      const links = galleryRef.value.querySelectorAll("a");
      if (links[index]) {
        // 使用 PhotoSwipe 的方法打开到指定索引
        lightbox.loadAndOpen(index, {
          gallery: galleryRef.value,
        });
      }
    }
  });
};

// 关闭 lightbox
const closeLightbox = () => {
  if (pswpInstance) {
    pswpInstance.close();
  }
};

// 监听 visible 变化
watch(
  () => props.visible,
  (newVal) => {
    if (newVal) {
      currentIndex.value = props.initialIndex;
      nextTick(() => {
        openLightbox(props.initialIndex);
      });
    } else {
      closeLightbox();
    }
  }
);

// 监听 images 变化，重新初始化
watch(
  () => props.images,
  () => {
    if (lightbox) {
      lightbox.destroy();
      lightbox = null;
    }
    nextTick(() => {
      initLightbox();
    });
  },
  { deep: true }
);

// 监听 initialIndex 变化
watch(
  () => props.initialIndex,
  (newIndex) => {
    if (props.visible && pswpInstance) {
      pswpInstance.goTo(newIndex);
    }
  }
);

onMounted(() => {
  nextTick(() => {
    initLightbox();
  });
});

onUnmounted(() => {
  if (lightbox) {
    lightbox.destroy();
    lightbox = null;
  }
  pswpInstance = null;
});
</script>

<style>
/* PhotoSwipe 自定义样式 */
.pswp-gallery {
  display: none;
}

/* 自定义标题样式 */
.pswp-custom-caption {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  color: white;
  background: rgba(0, 0, 0, 0.5);
  padding: 10px 20px;
  border-radius: 20px;
  font-size: 14px;
  z-index: 10;
  white-space: nowrap;
}

/* 导航按钮颜色 */
.pswp__button--arrow {
  color: #0048ff;
}

.pswp__button--arrow:hover {
  color: #0048ff;
  opacity: 0.8;
}

/* 修改 PhotoSwipe 背景 */
.pswp {
  --pswp-bg: rgba(0, 0, 0, 0.9);
}

/* 修改预加载指示器 */
.pswp__preloader {
  display: flex;
  justify-content: center;
  align-items: center;
}

/* 图片保持比例，不拉伸 */
.pswp__img {
  object-fit: contain !important;
}

/* 确保图片容器也正确 */
.pswp__item {
  display: flex;
  justify-content: center;
  align-items: center;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .pswp-custom-caption {
    font-size: 12px;
    padding: 8px 16px;
    bottom: 10px;
  }
}
</style>
