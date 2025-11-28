// 图片懒加载管理器
import { reactive } from "vue";

// 已加载图片的URL集合
const loadedImages = reactive(new Set<string>());

// 正在加载中的图片URL集合
const loadingImages = reactive(new Set<string>());

// 已加载的Image对象缓存（用于WebGL等需要Image对象的场景）
const imageObjectCache = new Map<string, HTMLImageElement>();

// 加载单张图片
export const loadImage = (url: string): Promise<HTMLImageElement | null> => {
  return new Promise((resolve, reject) => {
    if (!url) {
      resolve(null);
      return;
    }
    
    // 如果已经有缓存的Image对象，直接返回
    if (imageObjectCache.has(url)) {
      resolve(imageObjectCache.get(url)!);
      return;
    }

    if (loadingImages.has(url)) {
      // 已经在加载中，等待加载完成
      const checkLoaded = setInterval(() => {
        if (loadedImages.has(url)) {
          clearInterval(checkLoaded);
          resolve(imageObjectCache.get(url) || null);
        }
      }, 100);
      return;
    }

    loadingImages.add(url);

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      loadedImages.add(url);
      loadingImages.delete(url);
      imageObjectCache.set(url, img);
      resolve(img);
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
  await Promise.all(validUrls.map((url) => loadImage(url).catch(() => { })));
};

// 批量预加载图片（带进度回调）
export const preloadImagesWithProgress = async (
  urls: string[],
  onProgress?: (loaded: number, total: number, percentage: number) => void
): Promise<void> => {
  const validUrls = urls.filter((url) => url && !loadedImages.has(url));
  const total = validUrls.length;
  let loaded = 0;
  let failedCount = 0;
  const failedUrls: string[] = [];

  if (total === 0) {
    onProgress?.(0, 0, 100);
    return;
  }

  // 使用Promise.allSettled来确保所有图片都尝试加载
  const promises = validUrls.map(async (url) => {
    try {
      await loadImage(url);
    } catch (error) {
      console.warn(`Failed to load image: ${url}`, error);
      failedCount++;
      failedUrls.push(url);
    } finally {
      loaded++;
      const percentage = (loaded / total) * 100;
      onProgress?.(loaded, total, percentage);
    }
  });

  await Promise.allSettled(promises);

  // 如果有图片加载失败，抛出错误
  if (failedCount > 0) {
    throw new Error(`Failed to load ${failedCount} image(s): ${failedUrls.slice(0, 3).join(', ')}${failedCount > 3 ? '...' : ''}`);
  }
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
export const markImageAsLoaded = (url: string, img?: HTMLImageElement) => {
  if (url) {
    loadedImages.add(url);
    loadingImages.delete(url);
    if (img) {
      imageObjectCache.set(url, img);
    }
  }
};

// 获取缓存的Image对象
export const getCachedImage = (url: string): HTMLImageElement | null => {
  return imageObjectCache.get(url) || null;
};

// 批量加载图片并返回Image对象数组
export const loadImagesWithObjects = async (urls: string[]): Promise<(HTMLImageElement | null)[]> => {
  return Promise.all(urls.map(url => loadImage(url).catch(() => null)));
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
  getCachedImage,
  loadImagesWithObjects,
};
