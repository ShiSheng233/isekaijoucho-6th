<template>
  <div class="landing-page" @contextmenu.prevent>
    <InfiniteMenu :items="menuItems" :show-logo="showLogo" @item-change="handleItemChange"
      @movement-change="handleMovementChange" @navigate="handleNavigate" />
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import InfiniteMenu from "../components/InfiniteMenu.vue";
import { IMAGES } from "../utils/default";

// 定义组件名称，用于 keep-alive
defineOptions({
  name: 'index'
});

const props = defineProps({
  loadingComplete: {
    type: Boolean,
    default: false,
  },
});

const showLogo = ref(false);

const router = useRouter();

// 将 IMAGES 数据转换为 InfiniteMenu 需要的格式
// title: DAYxxx, description: name, image: url
const menuItems = computed(() => {
  const items = [];

  IMAGES.forEach((dayData) => {
    // 只添加有图片的项目
    dayData.children.forEach((child) => {
      if (child.url) {
        items.push({
          image: child.url,
          link: `/images?day=${dayData.days}`,
          title: `DAY${dayData.days}`,
          description: child.name,
          days: dayData.days,
          name: child.name,
          offset: child.offset || { x: 0, y: 0 }, // 传递offset配置
        });
      }
    });
  });

  return items;
});

// 处理当前选中项变化
const handleItemChange = (item) => {
  // 可以在这里处理选中项变化的逻辑
  // console.log("Active item:", item);
};

// 处理移动状态变化
const handleMovementChange = (isMoving) => {
  // console.log("Is moving:", isMoving);
};

// 处理导航
const handleNavigate = (path) => {
  router.push(path);
};

// 在loading完成后延迟显示logo
onMounted(() => {
  if (props.loadingComplete) {
    setTimeout(() => {
      showLogo.value = true;
    }, 100);
  } else {
    // 监听loadingComplete变化
    const timer = setInterval(() => {
      if (props.loadingComplete) {
        setTimeout(() => {
          showLogo.value = true;
        }, 100);
        clearInterval(timer);
      }
    }, 100);
  }
});
</script>

<style scoped lang="less">
.landing-page {
  height: 100vh;
  width: 100vw;
  position: fixed;
  top: 0;
  left: 0;
  overflow: hidden;
  cursor: none;
  // background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
}
</style>
