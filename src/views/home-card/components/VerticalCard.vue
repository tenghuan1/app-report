/**
* 垂直卡片组件
* @component
* @description 用于展示带有图标和数字的垂直布局卡片，支持通过SQL_ID查询数据
* @props {Object} info - 组件配置信息
* @props {string} info.SQL_ID - SQL查询ID，用于获取数据
* @props {string} info.CHART_CONFIG - JSON格式的配置字符串，包含title、value字段
* @props {string} info.CHART_CONFIG.title - 卡片标题
* @props {string} info.CHART_CONFIG.value - 用于计算总数的字段名
* @example
* <VerticalCard :info="item" />
*/
<template>
  <div class="vertical-card">
    <div class="card-title">{{ title }}</div>
    <div class="card-icon">
      <el-icon :size="40">
        <User />
      </el-icon>
    </div>
    <div class="card-value">{{ totalValue }}</div>
  </div>
</template>

<script setup>
import { defineProps, computed, ref, onMounted, onUnmounted } from "vue";
import { User } from "@element-plus/icons-vue";
import api from '@/api/index';

const props = defineProps({
  info: {
    type: Object,
    default: () => ({})
  },
});

const localData = ref([]);
const refreshInterval = ref(null);
const refreshEnabled = ref(true);
const intervalTime = ref(5);

// 从info.CHART_CONFIG中获取配置
const chartConfig = computed(() => {
  try {
    return props.info?.CHART_CONFIG ? JSON.parse(props.info.CHART_CONFIG) : null;
  } catch (e) {
    console.error('Failed to parse CHART_CONFIG:', e);
    return null;
  }
});

const title = computed(() => chartConfig.value?.title || "");
const valueField = computed(() => chartConfig.value?.value || "");

// 计算总数
const totalValue = computed(() => {
  if (!valueField.value || !localData.value || localData.value.length === 0) {
    return 0;
  }
  
  const sum = localData.value.reduce((acc, item) => {
    const val = parseFloat(item[valueField.value]) || 0;
    return acc + val;
  }, 0);
  
  return sum.toLocaleString();
});

// 加载刷新设置
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

// 设置自动刷新
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

// 刷新设置变化处理函数
const handleRefreshSettingsChange = () => {
  loadRefreshSettings();
  setupAutoRefresh();
};

// 从后台获取数据
const fetchData = async () => {
  const currentSqlId = props.info?.SQL_ID;
  if (!currentSqlId) return;
  
  try {
    const response = await api.executeData(currentSqlId, {});
    console.log('VerticalCard data:', response);
    
    if (response && Array.isArray(response) && response.length > 0) {
      localData.value = JSON.parse(response[0].DATA || '[]');
      console.log('VerticalCard data:-----', localData.value);
    }
  } catch (error) {
    console.error('Failed to fetch VerticalCard data:', error);
  }
};

onMounted(() => {
  loadRefreshSettings();
  setupAutoRefresh();
  window.addEventListener('refresh-settings-updated', handleRefreshSettingsChange);
  
  if (props.info?.SQL_ID) {
    fetchData();
  }
});

onUnmounted(() => {
  window.removeEventListener('refresh-settings-updated', handleRefreshSettingsChange);
  
  if (refreshInterval.value) {
    clearInterval(refreshInterval.value);
  }
});
</script>

<style lang="scss" scoped>
.vertical-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  padding: 16px;
  background: linear-gradient(135deg, #f5f7fa, #e8f4ff);
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border: 1px solid #e8f4ff;
  color: #303133;
  transition: all 0.3s ease;
  box-sizing: border-box;

  &:hover {
    box-shadow: 0 4px 16px rgba(64, 158, 255, 0.15);
    transform: translateY(-2px);
  }

  .card-title {
    font-size: 16px;
    font-weight: 500;
    margin-bottom: 12px;
    color: #606266;
  }

  .card-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 12px;
    color: #409EFF;
  }

  .card-value {
    font-size: 28px;
    font-weight: 700;
    color: #303133;
  }
}
</style>
