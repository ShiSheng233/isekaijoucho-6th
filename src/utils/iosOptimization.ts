// iOS性能优化和兼容性工具

/**
 * 检测是否为iOS设备
 */
export const isIOSDevice = (): boolean => {
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
};

/**
 * 检测是否为iPhone
 */
export const isIPhone = (): boolean => {
  return /iPhone/i.test(navigator.userAgent);
};

/**
 * 检测是否为iPad
 */
export const isIPad = (): boolean => {
  return /iPad/i.test(navigator.userAgent);
};

/**
 * 获取iOS版本号
 */
export const getIOSVersion = (): number | null => {
  const match = navigator.userAgent.match(/OS (\d+)_(\d+)_?(\d+)?/);
  if (match && match[1]) {
    return parseInt(match[1], 10);
  }
  return null;
};

/**
 * 检测WebGL 2支持
 */
export const checkWebGL2Support = (): boolean => {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2');
    return !!gl;
  } catch (e) {
    return false;
  }
};

/**
 * 获取推荐的纹理尺寸限制
 */
export const getRecommendedTextureSize = (): number => {
  if (isIPhone()) {
    return 256; // iPhone使用最小尺寸
  } else if (isIPad()) {
    return 512; // iPad使用中等尺寸
  } else if (isIOSDevice()) {
    return 512; // 其他iOS设备
  }
  return 1024; // 桌面设备
};

/**
 * 获取推荐的Canvas DPR
 */
export const getRecommendedDPR = (): number => {
  if (isIOSDevice()) {
    // iOS设备限制为1.5倍以提高性能
    return Math.min(1.5, window.devicePixelRatio);
  }
  return Math.min(2, window.devicePixelRatio);
};

/**
 * 优化图片尺寸（iOS内存限制）
 */
export const optimizeImageSize = (
  img: HTMLImageElement,
  maxSize: number = 2048
): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    if (img.width <= maxSize && img.height <= maxSize) {
      resolve(img);
      return;
    }

    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
      canvas.width = Math.floor(img.width * scale);
      canvas.height = Math.floor(img.height * scale);

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const scaledImg = new Image();
      scaledImg.onload = () => resolve(scaledImg);
      scaledImg.onerror = () => reject(new Error('Failed to load optimized image'));
      scaledImg.src = canvas.toDataURL('image/jpeg', 0.9);
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * 防止iOS下拉刷新
 */
export const preventIOSPullToRefresh = () => {
  if (!isIOSDevice()) return;

  let lastY = 0;
  
  document.body.addEventListener('touchstart', (e) => {
    if (e.touches && e.touches[0]) {
      lastY = e.touches[0].clientY;
    }
  }, { passive: false });

  document.body.addEventListener('touchmove', (e) => {
    if (!e.touches || !e.touches[0]) return;
    
    const currentY = e.touches[0].clientY;
    const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
    
    // 如果在顶部且向下滑动，阻止默认行为
    if (scrollTop === 0 && currentY > lastY) {
      e.preventDefault();
    }
  }, { passive: false });
};

/**
 * 防止iOS双击缩放
 */
export const preventIOSDoubleTapZoom = (element: HTMLElement) => {
  if (!isIOSDevice()) return;

  let lastTouchEnd = 0;
  element.addEventListener('touchend', (e) => {
    const now = Date.now();
    if (now - lastTouchEnd <= 300) {
      e.preventDefault();
    }
    lastTouchEnd = now;
  }, false);
};

/**
 * iOS内存警告监听
 */
export const onIOSMemoryWarning = (callback: () => void) => {
  if (!isIOSDevice()) return;

  if ('onwebkitmemorywarning' in window) {
    window.addEventListener('webkitmemorywarning', () => {
      console.warn('iOS memory warning received');
      callback();
    });
  }
};

/**
 * 获取WebGL最大纹理尺寸
 */
export const getMaxTextureSize = (): number => {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (gl) {
      return gl.getParameter(gl.MAX_TEXTURE_SIZE);
    }
  } catch (e) {
    console.warn('Failed to get max texture size:', e);
  }
  return 2048; // 默认安全值
};

/**
 * iOS性能优化初始化
 */
export const initIOSOptimizations = () => {
  if (!isIOSDevice()) return;

  // 防止下拉刷新
  document.body.style.overscrollBehavior = 'none';
  
  // 防止双击缩放
  const metaViewport = document.querySelector('meta[name="viewport"]');
  if (metaViewport) {
    metaViewport.setAttribute('content', 
      'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover'
    );
  }

  // 禁用文本选择
  (document.body.style as any).webkitUserSelect = 'none';
  document.body.style.userSelect = 'none';
  
  // 禁用长按菜单
  (document.body.style as any).webkitTouchCallout = 'none';
  
  // 禁用点击高亮
  (document.body.style as any).webkitTapHighlightColor = 'transparent';

  console.log('iOS optimizations initialized');
};

export default {
  isIOSDevice,
  isIPhone,
  isIPad,
  getIOSVersion,
  checkWebGL2Support,
  getRecommendedTextureSize,
  getRecommendedDPR,
  optimizeImageSize,
  preventIOSPullToRefresh,
  preventIOSDoubleTapZoom,
  onIOSMemoryWarning,
  getMaxTextureSize,
  initIOSOptimizations,
};
