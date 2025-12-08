// 图片懒加载管理器
import { reactive } from "vue";

// 已加载图片的URL集合
const loadedImages = reactive(new Set<string>());

// 正在加载中的图片URL集合
const loadingImages = reactive(new Set<string>());

// 已加载的Image对象缓存（用于WebGL等需要Image对象的场景）
const imageObjectCache = new Map<string, HTMLImageElement>();

// 正在加载的Promise缓存
const loadingPromises = new Map<string, Promise<HTMLImageElement | null>>();

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

    if (loadingPromises.has(url)) {
      // 已经在加载中，直接返回相同的Promise
      loadingPromises.get(url)!.then(resolve).catch(reject);
      return;
    }

    loadingImages.add(url);

    const loadPromise = new Promise<HTMLImageElement | null>((res, rej) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      
      // iOS Safari超时处理
      const timeout = setTimeout(() => {
        loadingImages.delete(url);
        loadingPromises.delete(url);
        rej(new Error(`Image load timeout: ${url}`));
      }, 15000); // 15秒超时
      
      img.onload = () => {
        clearTimeout(timeout);
        loadedImages.add(url);
        loadingImages.delete(url);
        loadingPromises.delete(url);
        
        // iOS内存优化：限制图片尺寸
        const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
        if (isIOS && (img.width > 2048 || img.height > 2048)) {
          // 创建缩小版本
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          const maxSize = 2048;
          const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
          canvas.width = Math.floor(img.width * scale);
          canvas.height = Math.floor(img.height * scale);
          ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
          
          // 转换为新的Image对象
          const scaledImg = new Image();
          scaledImg.onload = () => {
            // 先缓存再resolve，确保下次直接从缓存读取
            imageObjectCache.set(url, scaledImg);
            res(scaledImg);
          };
          scaledImg.onerror = () => {
            // 缩放失败，使用原图
            // console.warn('Failed to scale image, using original');
            imageObjectCache.set(url, img);
            res(img);
          };
          scaledImg.src = canvas.toDataURL('image/jpeg', 0.9);
        } else {
          // 先缓存再resolve
          imageObjectCache.set(url, img);
          res(img);
        }
      };
      
      img.onerror = () => {
        clearTimeout(timeout);
        loadingImages.delete(url);
        loadingPromises.delete(url);
        rej(new Error(`Failed to load image: ${url}`));
      };
      
      img.src = url;
    });

    loadingPromises.set(url, loadPromise);
    loadPromise.then(resolve).catch(reject);
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
  // 统计从缓存加载和需要新加载的数量
  const fromCache = urls.filter(url => imageObjectCache.has(url)).length;
  const needLoad = urls.length - fromCache;
  
  // if (needLoad > 0) {
  //   console.log(`[ImageLoader] Loading ${urls.length} images: ${fromCache} from cache, ${needLoad} need to load`);
  // }
  
  return Promise.all(urls.map(url => loadImage(url).catch(() => null)));
};

// 清理缓存（释放内存）
export const clearCache = () => {
  imageObjectCache.clear();
  loadedImages.clear();
  loadingImages.clear();
  loadingPromises.clear();
};

// 清理特定URL的缓存
export const clearImageCache = (url: string) => {
  imageObjectCache.delete(url);
  loadedImages.delete(url);
  loadingImages.delete(url);
  loadingPromises.delete(url);
};

// 获取缓存统计信息
export const getCacheStats = () => {
  return {
    cachedImagesCount: imageObjectCache.size,
    loadedImagesCount: loadedImages.size,
    loadingImagesCount: loadingImages.size,
    cachedUrls: Array.from(imageObjectCache.keys()).map(url => url.substring(0, 50) + '...')
  };
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
  clearCache,
  clearImageCache,
  getCacheStats,
};
