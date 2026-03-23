<template>
  <div class="multi-view-page">
    <MultiViewComponent :info="pageConfig" />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import MultiViewComponent from './components/MultiViewComponent.vue';
import { useMenuStore } from "@/stores/menu";

const menuStore = useMenuStore();
// 从Pinia store获取菜单信息
const routeInfo = computed(() => {
    return menuStore.getCurrentMenu;
});

const pageConfig = ref({
  CHART_CONFIG: JSON.stringify(routeInfo.value?.CHART_CONFIG || '{}')
});
</script>

<style lang="scss" scoped>
.multi-view-page {
  width: 100%;
  height: 100%;
  padding: 20px;
  box-sizing: border-box;
}
</style>
