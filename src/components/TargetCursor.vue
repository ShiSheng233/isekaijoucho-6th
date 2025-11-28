<template>
  <div v-if="!isMobile" ref="cursorRef" class="target-cursor-wrapper">
    <div ref="dotRef" class="target-cursor-dot" />
    <div class="target-cursor-corner corner-tl" />
    <div class="target-cursor-corner corner-tr" />
    <div class="target-cursor-corner corner-br" />
    <div class="target-cursor-corner corner-bl" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { gsap } from 'gsap';

const props = withDefaults(defineProps<{
  targetSelector?: string;
  spinDuration?: number;
  hideDefaultCursor?: boolean;
  hoverDuration?: number;
  parallaxOn?: boolean;
}>(), {
  targetSelector: '.cursor-target',
  spinDuration: 2,
  hideDefaultCursor: true,
  hoverDuration: 0.2,
  parallaxOn: true
});

const cursorRef = ref<HTMLDivElement | null>(null);
const dotRef = ref<HTMLDivElement | null>(null);
const cornersRef = ref<NodeListOf<HTMLDivElement> | null>(null);
const spinTl = ref<gsap.core.Timeline | null>(null);

const isActive = ref(false);
let targetCornerPositions: { x: number; y: number }[] | null = null;
const activeStrength = { current: 0 }; // Not reactive to avoid triggering updates, just for GSAP

const isMobile = ref(false);

const constants = { borderWidth: 3, cornerSize: 12 };

const checkMobile = () => {
  if (typeof window === 'undefined') return false;
  const hasTouchScreen = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const isSmallScreen = window.innerWidth <= 768;
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
  const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i;
  const isMobileUserAgent = mobileRegex.test(userAgent.toLowerCase());
  return (hasTouchScreen && isSmallScreen) || isMobileUserAgent;
};

const moveCursor = (x: number, y: number) => {
  if (!cursorRef.value) return;
  gsap.to(cursorRef.value, { x, y, duration: 0.1, ease: 'power3.out' });
};

let tickerFn: (() => void) | null = null;
let currentLeaveHandler: (() => void) | null = null;
let resumeTimeout: ReturnType<typeof setTimeout> | null = null;
let activeTarget: Element | null = null;
let originalCursor = '';
let cursorStyleElement: HTMLStyleElement | null = null;

const createSpinTimeline = () => {
  if (spinTl.value) {
    spinTl.value.kill();
  }
  if (!cursorRef.value) return;

  spinTl.value = gsap
    .timeline({ repeat: -1 })
    .to(cursorRef.value, { 
      rotation: '+=360', 
      duration: props.spinDuration, 
      ease: 'none',
      transformOrigin: '50% 50%'
    });
};

const moveHandler = (e: MouseEvent) => moveCursor(e.clientX, e.clientY);

const scrollHandler = () => {
  if (!activeTarget || !cursorRef.value) return;
  const mouseX = gsap.getProperty(cursorRef.value, 'x') as number;
  const mouseY = gsap.getProperty(cursorRef.value, 'y') as number;
  const elementUnderMouse = document.elementFromPoint(mouseX, mouseY);
  const isStillOverTarget =
    elementUnderMouse &&
    (elementUnderMouse === activeTarget || elementUnderMouse.closest(props.targetSelector) === activeTarget);
  if (!isStillOverTarget) {
    currentLeaveHandler?.();
  }
};

const mouseDownHandler = () => {
  if (!dotRef.value || !cursorRef.value) return;
  gsap.to(dotRef.value, { scale: 0.7, duration: 0.3 });
  gsap.to(cursorRef.value, { scale: 0.9, duration: 0.2 });
};

const mouseUpHandler = () => {
  if (!dotRef.value || !cursorRef.value) return;
  gsap.to(dotRef.value, { scale: 1, duration: 0.3 });
  gsap.to(cursorRef.value, { scale: 1, duration: 0.2 });
};

const cleanupTarget = (target: Element) => {
  if (currentLeaveHandler) {
    target.removeEventListener('mouseleave', currentLeaveHandler);
  }
  currentLeaveHandler = null;
};

const enterHandler = (e: Event) => {
  const mouseEvent = e as MouseEvent;
  const directTarget = mouseEvent.target as Element;
  const allTargets: Element[] = [];
  let current: Element | null = directTarget;

  while (current && current !== document.body) {
    if (current.matches(props.targetSelector)) {
      allTargets.push(current);
    }
    current = current.parentElement;
  }

  const target = allTargets[0] || null;

  if (!target || !cursorRef.value || !cornersRef.value) return;
  if (activeTarget === target) return;

  if (activeTarget) {
    cleanupTarget(activeTarget);
  }
  if (resumeTimeout) {
    clearTimeout(resumeTimeout);
    resumeTimeout = null;
  }

  activeTarget = target;
  const corners = Array.from(cornersRef.value);
  corners.forEach(corner => gsap.killTweensOf(corner));
  gsap.killTweensOf(cursorRef.value, 'rotation');
  spinTl.value?.pause();
  gsap.set(cursorRef.value, { rotation: 0 });

  const rect = target.getBoundingClientRect();
  const { borderWidth, cornerSize } = constants;
  const cursorX = gsap.getProperty(cursorRef.value, 'x') as number;
  const cursorY = gsap.getProperty(cursorRef.value, 'y') as number;

  targetCornerPositions = [
    { x: rect.left - borderWidth, y: rect.top - borderWidth },
    { x: rect.right + borderWidth - cornerSize, y: rect.top - borderWidth },
    { x: rect.right + borderWidth - cornerSize, y: rect.bottom + borderWidth - cornerSize },
    { x: rect.left - borderWidth, y: rect.bottom + borderWidth - cornerSize }
  ];

  isActive.value = true;
  if (tickerFn) gsap.ticker.add(tickerFn);

  gsap.to(activeStrength, { current: 1, duration: props.hoverDuration, ease: 'power2.out' });

  corners.forEach((corner, i) => {
    if (!targetCornerPositions || !targetCornerPositions[i]) return;
    gsap.to(corner, {
      x: targetCornerPositions[i].x - cursorX,
      y: targetCornerPositions[i].y - cursorY,
      duration: 0.2,
      ease: 'power2.out'
    });
  });

  const leaveHandler = () => {
    if (tickerFn) gsap.ticker.remove(tickerFn);
    isActive.value = false;
    targetCornerPositions = null;
    gsap.set(activeStrength, { current: 0, overwrite: true });
    activeTarget = null;

    if (cornersRef.value) {
      const corners = Array.from(cornersRef.value);
      gsap.killTweensOf(corners);
      const { cornerSize } = constants;
      const positions = [
        { x: -cornerSize * 1.5, y: -cornerSize * 1.5 },
        { x: cornerSize * 0.5, y: -cornerSize * 1.5 },
        { x: cornerSize * 0.5, y: cornerSize * 0.5 },
        { x: -cornerSize * 1.5, y: cornerSize * 0.5 }
      ];

      corners.forEach((corner, index) => {
        if (positions[index]) {
          gsap.to(corner, { x: positions[index].x, y: positions[index].y, duration: 0.3, ease: 'power3.out' });
        }
      });
    }

    resumeTimeout = setTimeout(() => {
      if (!activeTarget && cursorRef.value && spinTl.value) {
        const currentRotation = gsap.getProperty(cursorRef.value, 'rotation') as number;
        const normalizedRotation = currentRotation % 360;
        spinTl.value.kill();
        spinTl.value = gsap
          .timeline({ repeat: -1 })
          .to(cursorRef.value, { 
            rotation: '+=360', 
            duration: props.spinDuration, 
            ease: 'none',
            transformOrigin: '50% 50%'
          });

        gsap.to(cursorRef.value, {
          rotation: normalizedRotation + 360,
          duration: props.spinDuration * (1 - normalizedRotation / 360),
          ease: 'none',
          onComplete: () => {
            spinTl.value?.restart();
          }
        });
      }
      resumeTimeout = null;
    }, 50);

    cleanupTarget(target);
  };

  currentLeaveHandler = leaveHandler;
  target.addEventListener('mouseleave', leaveHandler);
};

onMounted(() => {
  isMobile.value = checkMobile();
  if (isMobile.value) return;

  nextTick(() => {
    if (!cursorRef.value) return;

    originalCursor = document.body.style.cursor;
    if (props.hideDefaultCursor) {
      document.body.style.cursor = 'none';
      // 强制隐藏所有元素的光标
      cursorStyleElement = document.createElement('style');
      // cursorStyleElement.innerHTML = '* { cursor: none !important; }';
      document.head.appendChild(cursorStyleElement);
    }

    const cursor = cursorRef.value;
    cornersRef.value = cursor.querySelectorAll<HTMLDivElement>('.target-cursor-corner');

    gsap.set(cursor, {
      xPercent: -50,
      yPercent: -50,
      x: window.innerWidth / 2,
      y: window.innerHeight / 2
    });

    createSpinTimeline();

    tickerFn = () => {
      if (!cursorRef.value || !cornersRef.value) {
        return;
      }

      if (activeTarget && isActive.value) {
        const rect = activeTarget.getBoundingClientRect();
        const { borderWidth, cornerSize } = constants;
        targetCornerPositions = [
          { x: rect.left - borderWidth, y: rect.top - borderWidth },
          { x: rect.right + borderWidth - cornerSize, y: rect.top - borderWidth },
          { x: rect.right + borderWidth - cornerSize, y: rect.bottom + borderWidth - cornerSize },
          { x: rect.left - borderWidth, y: rect.bottom + borderWidth - cornerSize }
        ];
      }

      if (!targetCornerPositions) return;

      const strength = activeStrength.current;
      if (strength === 0) return;

      const cursorX = gsap.getProperty(cursorRef.value, 'x') as number;
      const cursorY = gsap.getProperty(cursorRef.value, 'y') as number;
      const corners = Array.from(cornersRef.value);

      corners.forEach((corner, i) => {
        const currentX = gsap.getProperty(corner, 'x') as number;
        const currentY = gsap.getProperty(corner, 'y') as number;
        const targetPos = targetCornerPositions![i];
        if (!targetPos) return;

        const targetX = targetPos.x - cursorX;
        const targetY = targetPos.y - cursorY;
        const finalX = currentX + (targetX - currentX) * strength;
        const finalY = currentY + (targetY - currentY) * strength;

        const duration = strength >= 0.99 ? (props.parallaxOn ? 0.2 : 0) : 0.05;

        gsap.to(corner, {
          x: finalX,
          y: finalY,
          duration: duration,
          ease: duration === 0 ? 'none' : 'power1.out',
          overwrite: 'auto'
        });
      });
    };

    window.addEventListener('mousemove', moveHandler);
    window.addEventListener('scroll', scrollHandler, { passive: true, capture: true });
    window.addEventListener('mousedown', mouseDownHandler);
    window.addEventListener('mouseup', mouseUpHandler);
    window.addEventListener('mouseover', enterHandler);
  });
});

onUnmounted(() => {
  if (tickerFn) {
    gsap.ticker.remove(tickerFn);
  }
  window.removeEventListener('mousemove', moveHandler);
  window.removeEventListener('scroll', scrollHandler, { capture: true } as any);
  window.removeEventListener('mousedown', mouseDownHandler);
  window.removeEventListener('mouseup', mouseUpHandler);
  window.removeEventListener('mouseover', enterHandler);

  if (activeTarget && currentLeaveHandler) {
    activeTarget.removeEventListener('mouseleave', currentLeaveHandler);
  }

  spinTl.value?.kill();
  document.body.style.cursor = originalCursor;

  if (cursorStyleElement) {
    document.head.removeChild(cursorStyleElement);
    cursorStyleElement = null;
  }
});

watch(() => props.spinDuration, () => {
  if (isMobile.value) return;
  // Restart spin timeline with new duration
  if (spinTl.value && spinTl.value.isActive()) {
    createSpinTimeline();
  }
});
</script>

<style scoped>
.target-cursor-wrapper {
  position: fixed;
  top: 0;
  left: 0;
  width: 0;
  height: 0;
  pointer-events: none;
  z-index: 9999;
  mix-blend-mode: difference;
  transform: translate(-50%, -50%);
}

.target-cursor-dot {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 4px;
  height: 4px;
  background: #fff;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  will-change: transform;
}

.target-cursor-corner {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 12px;
  height: 12px;
  border: 3px solid #fff;
  will-change: transform;
}

.corner-tl {
  transform: translate(-150%, -150%);
  border-right: none;
  border-bottom: none;
}

.corner-tr {
  transform: translate(50%, -150%);
  border-left: none;
  border-bottom: none;
}

.corner-br {
  transform: translate(50%, 50%);
  border-left: none;
  border-top: none;
}

.corner-bl {
  transform: translate(-150%, 50%);
  border-right: none;
  border-top: none;
}
</style>