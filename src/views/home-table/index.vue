<template>
  <div class="multi-view-page">
    <MultiViewComponent :info="props.info" />
  </div>
</template>

<script setup>
import MultiViewComponent from './components/MultiViewComponent.vue';

const props = defineProps({
    info: {
        type: Object,
        default: null
    }
});
</script>

<style lang="scss" scoped>
.multi-view-page {
  width: 100%;
  height: 100%;
  box-sizing: border-box;
}
</style>
