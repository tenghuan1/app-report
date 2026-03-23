/**
* 双滚动表格组件
* @component
* @description 用于展示两个纵向排列的滚动表格
* @props {Object} info - 组件配置信息
* @props {string} info.SQL_ID - SQL查询ID，用于获取数据
* @props {string} info.CHART_CONFIG - JSON格式的配置字符串，包含相关配置
* @props {string} info.CHART_CONFIG.title - 组件标题，默认为'住院床位占床情况'
* @props {Array} info.CHART_CONFIG.tables - 表格配置数组
* @props {string} info.CHART_CONFIG.tables[].label - 表格标题，如'全院加床数'
* @props {string} info.CHART_CONFIG.tables[].sqlId - 表格数据查询SQL ID
* @props {string} info.CHART_CONFIG.tables[].function - 统计函数，支持'COUNT'/'AVERAGE'/'MAX'/'MIN'
* @props {string} info.CHART_CONFIG.tables[].field - 统计字段名
* @props {string} info.CHART_CONFIG.tables[].unit - 单位，如'张'/'元'
* @example
* <DoubleScrollTable :info="item" />
* // CHART_CONFIG示例
* // {
* //   "title": "住院床位占床情况",
* //   "tables": [
* //     {
* //       "label": "全院加床数",
* //       "sqlId": "bed_overflow",
* //       "function": "COUNT",
* //       "field": "科室",
* //       "unit": "张"
* //     },
* //     {
* //       "label": "全院空床数",
* //       "sqlId": "bed_empty",
* //       "function": "AVERAGE",
* //       "field": "空床数",
* //       "unit": "张"
* //     }
* //   ]
* // }
*/
<template>
  <div class="double-scroll-table">
    <div v-for="(table, index) in tables" :key="index" class="table-section">
      <div class="table-header">
        <div class="table-label">{{ table.label }}</div>
        <div class="table-total">{{ calculateTotal(table) }}{{ table.unit }}</div>
      </div>
      
      <div class="table-container">
        <ScrollTable :info="{ SQL_ID: table.sqlId }" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import ScrollTable from './ScrollTable.vue';
import api from '@/api/index';

const props = defineProps({
  info: {
    type: Object,
    default: () => ({})
  }
});

const tableData = ref({});
const refreshInterval = ref(null);
const refreshEnabled = ref(true);
const intervalTime = ref(5);

// 从info.CHART_CONFIG中获取配置
const chartConfig = computed(() => {
  try {
    return props.info?.CHART_CONFIG ? JSON.parse(props.info.CHART_CONFIG) : {};
  } catch (e) {
    console.error('Failed to parse CHART_CONFIG:', e);
    return {};
  }
});

// 配置项
const title = computed(() => chartConfig.value.title || '住院床位占床情况');
const tables = computed(() => {
  const defaultTables = [
    {
      label: '全院加床数',
      sqlId: '',
      function: 'COUNT',
      field: '',
      unit: '张'
    },
    {
      label: '全院空床数',
      sqlId: '',
      function: 'COUNT',
      field: '',
      unit: '张'
    }
  ];
  return chartConfig.value.tables || defaultTables;
});

// 计算统计值
const calculateTotal = (table) => {
  const data = tableData.value[table.sqlId] || [];
  if (!data || data.length === 0) return 0;
  
  const func = table.function || 'COUNT';
  const field = table.field;
  
  switch (func) {
    case 'COUNT':
      if (field) {
        const uniqueValues = new Set(data.map(d => d[field]));
        return uniqueValues.size;
      }
      return data.length;
    case 'AVERAGE':
      if (!field) return 0;
      const sum = data.reduce((acc, d) => acc + (parseFloat(d[field]) || 0), 0);
      return (sum / data.length).toFixed(2);
    case 'MAX':
      if (!field) return 0;
      const max = Math.max(...data.map(d => parseFloat(d[field]) || 0));
      return max.toFixed(2);
    case 'MIN':
      if (!field) return 0;
      const min = Math.min(...data.map(d => parseFloat(d[field]) || 0));
      return min.toFixed(2);
    default:
      return 0;
  }
};

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
      fetchAllData();
    }, intervalTime.value * 1000);
  }
};

// 刷新设置变化处理函数
const handleRefreshSettingsChange = () => {
  loadRefreshSettings();
  setupAutoRefresh();
};

// 从后台获取数据
const fetchData = async (sqlId) => {
  if (!sqlId) return;
  
  try {
    const response = await api.executeData(sqlId, {});
    console.log('DoubleScrollTable data:', response);
    
    if (response && Array.isArray(response) && response.length > 0) {
      tableData.value[sqlId] = JSON.parse(response[0].DATA || '[]');
      console.log('DoubleScrollTable data:-----', tableData.value[sqlId]);
    }
  } catch (error) {
    console.error('Failed to fetch DoubleScrollTable data:', error);
  }
};

// 获取所有表格数据
const fetchAllData = () => {
  tables.value.forEach(table => {
    if (table.sqlId) {
      fetchData(table.sqlId);
    }
  });
};

onMounted(() => {
  loadRefreshSettings();
  setupAutoRefresh();
  window.addEventListener('refresh-settings-updated', handleRefreshSettingsChange);
  
  // 初始加载数据
  fetchAllData();
});

onUnmounted(() => {
  window.removeEventListener('refresh-settings-updated', handleRefreshSettingsChange);
  
  if (refreshInterval.value) {
    clearInterval(refreshInterval.value);
  }
});
</script>

<style lang="scss" scoped>
.double-scroll-table {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  padding: 16px;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border: 1px solid #e8f4ff;

  .table-section {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
    margin-bottom: 12px;

    &:last-child {
      margin-bottom: 0;
    }

    .table-header {
      flex-shrink: 0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
      padding: 8px 12px;
      background: linear-gradient(135deg, #409EFF, #1976D2);
      color: #ffffff;
      border-radius: 8px;

      .table-label {
        font-size: 14px;
        font-weight: 500;
      }

      .table-total {
        font-size: 14px;
        font-weight: 600;
      }
    }

    .table-container {
      flex: 1;
      width: 100%;
      min-height: 0;
      overflow: hidden;
    }
  }
}
</style>
