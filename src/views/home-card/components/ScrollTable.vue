/**
 * 滚动表格组件
 * @component
 * @description 用于展示滚动表格数据，支持自动刷新和分页轮播
 * @props {Object} info - 组件配置信息
 * @props {string} info.SQL_ID - SQL查询ID，用于获取数据
 * @example <ScrollTable :info="item" />
 */
<template>
  <div class="scroll-table-container" ref="containerRef">
    <ScrollBoard :config="config" style="width:100%;height:100%" />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, nextTick } from "vue";
import api from '@/api/index';
import { ScrollBoard } from '@kjgl77/datav-vue3';

const props = defineProps({
  info: {
    type: Object,
    default: () => ({})
  }
});

const containerRef = ref(null);
const localData = ref([]);
const refreshInterval = ref(null);
const refreshEnabled = ref(true);
const intervalTime = ref(5);
const forceUpdateKey = ref(0);
const rowNum = ref(5);

const calculateRowNum = () => {
  if (!containerRef.value) return;
  
  const containerHeight = containerRef.value.clientHeight;
  const headerHeight = 40;
  const rowHeight = 32;
  
  const availableHeight = containerHeight - headerHeight;
  const calculatedRows = Math.floor(availableHeight / rowHeight);
  
  const newRowNum = Math.max(1, calculatedRows);
  // 只有当rowNum真正变化时才更新，避免无限循环
  if (newRowNum !== rowNum.value) {
    rowNum.value = newRowNum;
    forceUpdateKey.value++;
  }
};

const config = computed(() => {
  const data = localData.value;
  
  if (!data || data.length === 0) {
    const textColor = '#303133';
    const primaryColor = '#409EFF';
    const borderColor = '#ebeef5';
    
    return {
      header: ['无数据'],
      data: [['请配置SQL ID']],
      columnWidth: [],
      align: ['center'],
      headerBGC: primaryColor,
      oddRowBGC: borderColor,
      evenRowBGC: 'transparent',
      rowNum: rowNum.value,
      waitTime: 4000,
      textColor: textColor
    };
  }

  const keys = Object.keys(data[0]);
  const header = keys;
  const tableData = data.map(item => keys.map(key => item[key] || ''));

  const primaryColor = '#409EFF';
  const borderColor = '#ebeef5';
  const textColor = '#303133';

  return {
    header: header,
    data: tableData,
    columnWidth: [],
    align: keys.map(() => 'center'),
    headerBGC: primaryColor,
    oddRowBGC: borderColor,
    evenRowBGC: 'transparent',
    rowNum: rowNum.value,
    waitTime: 4000,
    carousel: 'page',
    hoverPause: true,
    textColor: textColor
  };
});

const loadRefreshSettings = () => {
  const savedInterval = localStorage.getItem("refreshInterval");
  const savedEnabled = localStorage.getItem("refreshEnabled");
  
  if (savedInterval) {
    intervalTime.value = parseInt(savedInterval);
  }
  if (savedEnabled !== null) {
    refreshEnabled.value = savedEnabled === "true";
  }
};

const setupAutoRefresh = () => {
  if (refreshInterval.value) {
    clearInterval(refreshInterval.value);
  }
  
  if (refreshEnabled.value) {
    refreshInterval.value = setInterval(() => {
      fetchData();
    }, intervalTime.value * 1000);
  }
};

const handleRefreshSettingsChange = () => {
  loadRefreshSettings();
  setupAutoRefresh();
};

const handleThemeChange = () => {
  // 主题变化时，强制重新计算config，确保颜色立即更新
  forceUpdateKey.value++;
};

const fetchData = async () => {
  const currentSqlId = props.info?.SQL_ID || props.info?.SqlId;
  if (!currentSqlId) return;
  
  try {
    const response = await api.executeData(currentSqlId, {});
    console.log('ScrollTable data:', response);
    
    if (response && Array.isArray(response) && response.length > 0) {
      localData.value = JSON.parse(response[0].DATA || '[]');
      console.log('ScrollTable data:-----', localData.value);
    }
  } catch (error) {
    console.error('Failed to fetch ScrollTable data:', error);
  }
};

onMounted(() => {
  loadRefreshSettings();
  setupAutoRefresh();
  window.addEventListener('refresh-settings-updated', handleRefreshSettingsChange);
  window.addEventListener('themeChange', handleThemeChange);
  window.addEventListener('resize', calculateRowNum);
  
  if (props.info?.SQL_ID) {
    fetchData();
  }
  
  nextTick(() => {
    calculateRowNum();
  });
});

onUnmounted(() => {
  window.removeEventListener('refresh-settings-updated', handleRefreshSettingsChange);
  window.removeEventListener('themeChange', handleThemeChange);
  window.removeEventListener('resize', calculateRowNum);
  
  if (refreshInterval.value) {
    clearInterval(refreshInterval.value);
  }
});
</script>

<style scoped>
.scroll-table-container {
  width: 100%;
  height: 100%;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

/* 确保表格内容字体颜色为黑色 */
:deep(.dv-scroll-board) {
  color: #000000 !important;
}

:deep(.dv-scroll-board .board-item) {
  color: #000000 !important;
}

:deep(.dv-scroll-board .board-header) {
  color: #000000 !important;
}
</style>
