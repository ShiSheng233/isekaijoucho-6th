// 图片懒加载管理器
import { reactive } from "vue";

// 已加载图片的URL集合
const loadedImages = reactive(new Set<string>());

// 正在加载中的图片URL集合
const loadingImages = reactive(new Set<string>());

// 加载单张图片
export const loadImage = (url: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!url || loadedImages.has(url)) {
      resolve();
      return;
    }

    if (loadingImages.has(url)) {
      // 已经在加载中，等待加载完成
      const checkLoaded = setInterval(() => {
        if (loadedImages.has(url)) {
          clearInterval(checkLoaded);
          resolve();
        }
      }, 100);
      return;
    }

    loadingImages.add(url);

    const img = new Image();
    img.onload = () => {
      loadedImages.add(url);
      loadingImages.delete(url);
      resolve();
    };
    img.onerror = () => {
      loadingImages.delete(url);
      reject(new Error(`Failed to load image: ${url}`));
    };
    img.src = url;
  });
};

// 批量预加载图片
export const preloadImages = async (urls: string[]): Promise<void> => {
  const validUrls = urls.filter((url) => url && !loadedImages.has(url));
  await Promise.all(validUrls.map((url) => loadImage(url).catch(() => {})));
};

// 批量预加载图片（带进度回调）
export const preloadImagesWithProgress = async (
  urls: string[],
  onProgress?: (loaded: number, total: number, percentage: number) => void
): Promise<void> => {
  const validUrls = urls.filter((url) => url && !loadedImages.has(url));
  const total = validUrls.length;
  let loaded = 0;

  if (total === 0) {
    onProgress?.(0, 0, 100);
    return;
  }

  // 使用Promise.allSettled来确保即使某些图片加载失败也能继续
  const promises = validUrls.map(async (url) => {
    try {
      await loadImage(url);
    } catch (error) {
      console.warn(`Failed to load image: ${url}`, error);
    } finally {
      loaded++;
      const percentage = (loaded / total) * 100;
      onProgress?.(loaded, total, percentage);
    }
  });

  await Promise.allSettled(promises);
};

// 检查图片是否已加载
export const isImageLoaded = (url: string): boolean => {
  return loadedImages.has(url);
};

// 检查图片是否正在加载
export const isImageLoading = (url: string): boolean => {
  return loadingImages.has(url);
};

// 获取已加载的图片集合（用于响应式）
export const getLoadedImages = () => loadedImages;

// 标记图片为已加载（用于已经在DOM中加载完成的图片）
export const markImageAsLoaded = (url: string) => {
  if (url) {
    loadedImages.add(url);
    loadingImages.delete(url);
  }
};

// 导出默认实例
export default {
  loadImage,
  preloadImages,
  preloadImagesWithProgress,
  isImageLoaded,
  isImageLoading,
  getLoadedImages,
  markImageAsLoaded,
};
