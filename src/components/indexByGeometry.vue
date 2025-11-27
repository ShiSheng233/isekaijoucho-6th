<template>
  <div class="page-geometry">
    <div class="geometric-shapes">
      <div class="shape shape-1"></div>
      <div class="shape shape-2"></div>
      <div class="shape shape-3"></div>
      <div class="shape shape-4"></div>
      <div class="shape shape-5"></div>
    </div>
    <div class="geometry-title">几何</div>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted } from "vue";

onMounted(() => {});

onUnmounted(() => {});
</script>

<style scoped lang="less">
.page-geometry {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  width: 100%;
  color: white;
  position: relative;
}

.geometric-shapes {
  position: relative;
  width: 300px;
  height: 300px;
  margin-bottom: 2rem;
}

.shape {
  position: absolute;
  opacity: 0.8;
  animation: rotate 20s linear infinite;
}

.shape-1 {
  width: 100px;
  height: 100px;
  background: linear-gradient(45deg, #3498db, #2980b9);
  border-radius: 10px;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) rotate(0deg);
  animation-duration: 15s;
}

.shape-2 {
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #e74c3c, #c0392b);
  border-radius: 50%;
  top: 20%;
  left: 20%;
  animation-duration: 20s;
  animation-direction: reverse;
}

.shape-3 {
  width: 0;
  height: 0;
  border-left: 40px solid transparent;
  border-right: 40px solid transparent;
  border-bottom: 70px solid #f39c12;
  top: 70%;
  left: 30%;
  animation-duration: 18s;
}

.shape-4 {
  width: 60px;
  height: 60px;
  background: linear-gradient(90deg, #9b59b6, #8e44ad);
  transform: rotate(45deg);
  top: 25%;
  right: 25%;
  animation-duration: 22s;
  animation-direction: reverse;
}

.shape-5 {
  width: 70px;
  height: 70px;
  background: linear-gradient(180deg, #1abc9c, #16a085);
  clip-path: polygon(50% 0%, 0% 100%, 100% 100%);
  bottom: 20%;
  right: 20%;
  animation-duration: 25s;
}

.geometry-title {
  font-size: 2.5rem;
  font-weight: bold;
  letter-spacing: 3px;
  text-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  z-index: 10;
}

@keyframes rotate {
  0% {
    transform: translate(-50%, -50%) rotate(0deg);
  }
  100% {
    transform: translate(-50%, -50%) rotate(360deg);
  }
}

.shape-2 {
  animation-name: rotate-reverse;
}

.shape-4 {
  animation-name: rotate-center;
}

@keyframes rotate-reverse {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(-360deg);
  }
}

@keyframes rotate-center {
  0% {
    transform: rotate(45deg);
  }
  100% {
    transform: rotate(405deg);
  }
}
</style>
