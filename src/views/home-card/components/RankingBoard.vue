/**
 * 排名轮播表组件
 * @component
 * @description 用于展示排名数据，支持自动轮播和排序
 * @props {Object} info - 组件配置信息
 * @props {string} info.CHART_CONFIG - JSON格式的配置字符串，包含rankingName、rankingCount等字段
 * @props {string} info.CHART_CONFIG.rankingName - 排名名称字段
 * @props {string} info.CHART_CONFIG.rankingCount - 排名数值字段，格式为"字段名:排序方式(asc/desc)"
 * @example <RankingBoard :info="item" />
 */
<template>
  <div class="ranking-board-container" ref="containerRef">
    <ScrollRankingBoard :config="config" style="width:100%;height:100%" />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, nextTick } from "vue";
import api from '@/api/index';
import { ScrollRankingBoard } from '@kjgl77/datav-vue3';

const props = defineProps({
  info: {
    type: Object,
    default: () => ({})
  }
});

const localData = ref([]);
const refreshInterval = ref(null);
const refreshEnabled = ref(true);
const intervalTime = ref(5);
const containerRef = ref(null);
const containerHeight = ref(0); // 初始值为0，等待实际高度计算
const rowNum = ref(5); // 使用ref存储rowNum，避免频繁变化
const forceUpdateKey = ref(0); // 用于强制更新组件

// 根据容器高度计算每页显示的行数
const calculateRowNum = (height) => {
  // 如果高度为0，返回一个合理的默认值
  if (!height || height <= 0) {
    return 5;
  }
  const rowHeight = 35;
  const headerHeight = 40;
  const availableHeight = height - headerHeight;
  const rowNum = Math.floor(availableHeight / rowHeight);
  // 至少显示3行，不限制最大行数，让组件根据高度自动适配
  return Math.max(3, rowNum);
};

// 更新容器高度和rowNum
const updateContainerHeight = (force = false) => {
  nextTick(() => {
    if (containerRef.value) {
      const newHeight = containerRef.value.offsetHeight;
      // 强制更新或高度变化超过5像素时才更新
      if (force || Math.abs(newHeight - containerHeight.value) > 5) {
        containerHeight.value = newHeight;
        // 同时更新rowNum
        const newRowNum = calculateRowNum(newHeight);
        if (newRowNum !== rowNum.value) {
          rowNum.value = newRowNum;
        }
      }
    }
  });
};

// 监听窗口大小变化
const handleResize = () => {
  updateContainerHeight();
};

const config = computed(() => {
  const data = localData.value;

  if (!data || data.length === 0) {
    return {
      data: [],
      rowNum: rowNum.value,
      waitTime: 4000,
      carousel: 'page',
      unit: ''
    };
  }

  // 从CHART_CONFIG获取配置
  let chartConfig = null;
  try {
    chartConfig = props.info?.CHART_CONFIG ? JSON.parse(props.info.CHART_CONFIG) : null;
  } catch (e) {
    console.error('Failed to parse CHART_CONFIG:', e);
  }
  
  // 获取配置项
  const rankingNameField = chartConfig?.rankingName || props.info?.RANKING_NAME || '';
  const rankingCountConfig = chartConfig?.rankingCount || props.info?.RANKING_COUNT || '';

  console.log('RANKING_COUNT:', rankingCountConfig);
  // 解析RANKING_COUNT配置，格式：字段名:排序方式(asc/desc)
  let rankingCountField = rankingCountConfig;
  let sortOrder = 'desc';
  if (rankingCountConfig.includes(':')) {
    const parts = rankingCountConfig.split(':');
    rankingCountField = parts[0];
    sortOrder = parts[1] || 'desc';
  }

  if (!rankingNameField || !rankingCountField) {
    return {
      data: [],
      rowNum: rowNum.value,
      waitTime: 2000,
      unit: '',
      color: '#fff'
    };
  }

  // 处理数据：按名称汇总数量
  const aggregatedData = {};
  data.forEach(item => {
    const name = item[rankingNameField];
    const count = parseFloat(item[rankingCountField]) || 0;

    if (name) {
      if (!aggregatedData[name]) {
        aggregatedData[name] = 0;
      }
      aggregatedData[name] += count;
    }
  });

  // 转换为数组格式
  let rankingData = Object.entries(aggregatedData).map(([name, value]) => ({
    name: name,
    value: value
  }));

  // 排序
  rankingData.sort((a, b) => {
    return sortOrder === 'asc' ? a.value - b.value : b.value - a.value;
  });

  // 使用默认颜色
  const primaryColor = '#409EFF';
  const textColor = '#303133';

  return {
    data: rankingData,
    rowNum: rowNum.value,
    waitTime: 2000,
    unit: '',
    color: primaryColor,
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
  // 主题变化时，config会自动重新计算
};

const fetchData = async () => {
  const currentSqlId = props.info?.SQL_ID;
  if (!currentSqlId) return;

  try {
    const response = await api.executeData(currentSqlId, {});
    console.log('RankingBoard data:', response);

    if (response && Array.isArray(response) && response.length > 0) {
      localData.value = response[0].DATA ?JSON.parse(response[0].DATA || '[]') : response;
      console.log('RankingBoard data:-----', localData.value);
      // 数据加载后更新容器高度
      updateContainerHeight();
    }
  } catch (error) {
    console.error('Failed to fetch RankingBoard data:', error);
  }
};

onMounted(() => {
  loadRefreshSettings();
  setupAutoRefresh();
  window.addEventListener('refresh-settings-updated', handleRefreshSettingsChange);
  window.addEventListener('resize', handleResize);
  window.addEventListener('themeChange', handleThemeChange);

  if (props.info?.SQL_ID) {
    fetchData();
  }
  
  // 初始化容器高度，强制更新
  setTimeout(() => {
    updateContainerHeight(true);
  }, 100);
});

onUnmounted(() => {
  window.removeEventListener('refresh-settings-updated', handleRefreshSettingsChange);
  window.removeEventListener('resize', handleResize);
  window.removeEventListener('themeChange', handleThemeChange);

  if (refreshInterval.value) {
    clearInterval(refreshInterval.value);
  }
});
</script>

<style scoped>
.ranking-board-container {
  width: 100%;
  height: 100%;
  min-height: 150px;
  overflow: hidden;
}

.ranking-board-container :deep(.dv-scroll-ranking-board) {
  width: 100% !important;
  height: 100% !important;
}

/* 确保行高固定，避免间隔问题 */
.ranking-board-container :deep(.row-item) {
  height: 35px !important;
  line-height: 35px !important;
}
</style>
