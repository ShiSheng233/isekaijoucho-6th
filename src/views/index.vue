<template>
  <div class="full-page page-a">
    <!-- 随机显示的页面组件 -->
    <component 
      :is="currentRandomComponent" 
      v-if="currentRandomComponent"
      class="random-content"
    />
    
    <!-- 默认内容 -->
    <div v-else class="default-content">
      <h1>ISEKAIJOUCHO 6TH</h1>
      <p>向下滚动进入画廊</p>
    </div>
    
    <div class="indicator">↓</div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import IndexByInstant from '../components/indexByInstant.vue'
import IndexByGeometry from '../components/indexByGeometry.vue'

// A 页面没有内部滚动，始终在顶部
const emit = defineEmits(['scroll-state'])

// 随机页面组件列表
const randomComponents = [
  IndexByInstant,
  //IndexByGeometry
  // 未来可以在这里添加更多组件
]

// 当前显示的随机组件
const currentRandomComponent = ref(null)

// 随机选择一个组件显示
const selectRandomComponent = () => {
  const randomIndex = Math.floor(Math.random() * randomComponents.length)
  currentRandomComponent.value = randomComponents[randomIndex]
}

onMounted(() => {
  // 随机选择一个组件
  selectRandomComponent()
  
  emit('scroll-state', {
    isAtTop: true,
    isAtBottom: true,
    canScroll: false
  })
})

onUnmounted(() => {
  emit('scroll-state', {
    isAtTop: true,
    isAtBottom: true,
    canScroll: false
  })
})
</script>

<style scoped lang="less">
.full-page {
  height: 100vh;
  width: 100vw;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  position: absolute;
  top: 0;
  left: 0;
  overflow: hidden;
}

.page-a {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.random-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  z-index: 1;
}

.default-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  
  h1 {
    font-size: 3rem;
    margin-bottom: 1rem;
    font-weight: bold;
    letter-spacing: 2px;
  }
  
  p {
    font-size: 1.2rem;
    opacity: 0.8;
    margin: 0;
  }
}

.indicator {
  position: absolute;
  bottom: 50px;
  font-size: 2rem;
  animation: bounce 2s infinite;
  z-index: 2;
}

@keyframes bounce {
  0%, 20%, 50%, 80%, 100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-10px);
  }
  60% {
    transform: translateY(-5px);
  }
}

// 为随机组件提供基础样式
:deep(.full-page) {
  background: transparent !important;
  color: white;
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

:deep(.page-instant),
:deep(.page-geometry) {
  background: transparent;
  color: white;
  text-align: center;
  
  h1 {
    font-size: 2.5rem;
    font-weight: bold;
    margin-bottom: 1rem;
    letter-spacing: 3px;
  }
}
</style>