/**
* 带信息区域的柱状图组件
* @component
* @description 用于展示带有右上方信息区域的柱状图
* @props {Object} info - 组件配置信息
* @props {string} info.SQL_ID - SQL查询ID，用于获取数据
* @props {string} info.CHART_CONFIG - JSON格式的配置字符串，包含相关配置
* @props {string} info.CHART_CONFIG.title - 图表标题，默认为'门诊候诊等待人数时间分布'
* @props {string} info.CHART_CONFIG.xAxisField - X轴数据字段，默认为'time'
* @props {string} info.CHART_CONFIG.yAxisField - Y轴数据字段，默认为'count'
* @props {Array} info.CHART_CONFIG.infoItems - 信息区域配置项数组
* @props {string} info.CHART_CONFIG.infoItems[].label - 标签文本，如'一共'
* @props {string} info.CHART_CONFIG.infoItems[].function - 统计函数，支持'COUNT'/'AVERAGE'/'MAX'/'MIN'
* @props {string} info.CHART_CONFIG.infoItems[].field - 统计字段名
* @props {string} info.CHART_CONFIG.infoItems[].unit - 单位，如'人'/'元'
* @example
* <BarChartWithInfo :info="item" />
* // CHART_CONFIG示例
* // {
* //   "title": "门诊候诊等待人数时间分布",
* //   "xAxisField": "time",
* //   "yAxisField": "count",
* //   "infoItems": [
* //     {
* //       "label": "一共",
* //       "function": "COUNT",
* //       "field": "姓名",
* //       "unit": "人"
* //     },
* //     {
* //       "label": "平均金额",
* //       "function": "AVERAGE",
* //       "field": "总金额",
* //       "unit": "元"
* //     }
* //   ]
* // }
*/
<template>
  <div class="bar-chart-with-info">
    <div class="chart-container">
      <div ref="chartRef" class="chart"></div>
    </div>
    <div class="info-section">
      <div v-for="(item, index) in infoItems" :key="index" class="info-item">
        <span class="info-label">{{ item.label }}</span>
        <span class="info-value">{{ calculateValue(item) }}</span>
        <span class="info-unit">{{ item.unit }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue';
import * as echarts from 'echarts';
import api from '@/api/index';

const props = defineProps({
  info: {
    type: Object,
    default: () => ({})
  }
});

const chartRef = ref(null);
const chartInstance = ref(null);
const localData = ref([]);
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
const chartTitle = computed(() => chartConfig.value.title || '门诊候诊等待人数时间分布');
const xAxisField = computed(() => chartConfig.value.xAxisField || 'time');
const yAxisField = computed(() => chartConfig.value.yAxisField || 'count');
const infoItems = computed(() => {
  const defaultItems = [
    {
      label: '等待',
      function: 'COUNT',
      field: '',
      unit: '人'
    },
    {
      label: '平均等待',
      function: 'AVERAGE',
      field: 'waitingTime',
      unit: '分钟'
    }
  ];
  return chartConfig.value.infoItems || defaultItems;
});

// 计算统计值
const calculateValue = (item) => {
  if (!localData.value || localData.value.length === 0) return 0;
  
  const func = item.function || 'COUNT';
  const field = item.field;
  
  switch (func) {
    case 'COUNT':
      if (field) {
        const uniqueValues = new Set(localData.value.map(d => d[field]));
        return uniqueValues.size;
      }
      return localData.value.length;
    case 'AVERAGE':
      if (!field) return 0;
      const sum = localData.value.reduce((acc, d) => acc + (parseFloat(d[field]) || 0), 0);
      return (sum / localData.value.length).toFixed(2);
    case 'MAX':
      if (!field) return 0;
      const max = Math.max(...localData.value.map(d => parseFloat(d[field]) || 0));
      return max.toFixed(2);
    case 'MIN':
      if (!field) return 0;
      const min = Math.min(...localData.value.map(d => parseFloat(d[field]) || 0));
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
      fetchData();
    }, intervalTime.value * 1000);
  }
};

// 刷新设置变化处理函数
const handleRefreshSettingsChange = () => {
  loadRefreshSettings();
  setupAutoRefresh();
};

// 初始化图表
const initChart = () => {
  if (!chartRef.value) return;
  
  chartInstance.value = echarts.init(chartRef.value);
  updateChart();
  
  window.addEventListener('resize', () => {
    chartInstance.value?.resize();
  });
};

// 更新图表
const updateChart = () => {
  if (!chartInstance.value) return;
  
  const option = {
    title: {
      text: chartTitle.value,
      left: 'left',
      textStyle: {
        fontSize: 14,
        color: '#303133'
      }
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: localData.value.map(item => item[xAxisField.value] || ''),
      axisLabel: {
        interval: 0,
        rotate: 45
      }
    },
    yAxis: {
      type: 'value',
      name: '等待人数',
      nameTextStyle: {
        padding: [0, 0, 0, 40]
      }
    },
    series: [{
      name: '等待人数',
      type: 'bar',
      data: localData.value.map(item => parseInt(item[yAxisField.value]) || 0),
      itemStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: '#409EFF' },
          { offset: 1, color: '#1976D2' }
        ])
      }
    }]
  };
  
  chartInstance.value.setOption(option);
};

// 从后台获取数据
const fetchData = async () => {
  const currentSqlId = props.info?.SQL_ID;
  if (!currentSqlId) return;
  
  try {
    const response = await api.executeData(currentSqlId, {});
    console.log('BarChartWithInfo data:', response);
    
    if (response && Array.isArray(response) && response.length > 0) {
      localData.value = JSON.parse(response[0].DATA || '[]');
      console.log('BarChartWithInfo data:-----', localData.value);
      updateChart();
    }
  } catch (error) {
    console.error('Failed to fetch BarChartWithInfo data:', error);
  }
};

onMounted(() => {
  loadRefreshSettings();
  setupAutoRefresh();
  window.addEventListener('refresh-settings-updated', handleRefreshSettingsChange);
  initChart();
  
  if (props.info?.SQL_ID) {
    fetchData();
  }
});

onUnmounted(() => {
  window.removeEventListener('refresh-settings-updated', handleRefreshSettingsChange);
  window.removeEventListener('resize', () => {
    chartInstance.value?.resize();
  });
  
  if (refreshInterval.value) {
    clearInterval(refreshInterval.value);
  }
  
  chartInstance.value?.dispose();
});
</script>

<style lang="scss" scoped>
.bar-chart-with-info {
  position: relative;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  padding: 16px;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border: 1px solid #e8f4ff;

  .chart-container {
    width: 100%;
    height: 100%;
    min-height: 200px;
  }

  .chart {
    width: 100%;
    height: 100%;
  }

  .info-section {
    position: absolute;
    top: 16px;
    right: 16px;
    background: linear-gradient(135deg, #409EFF, #1976D2);
    color: #ffffff;
    padding: 8px 12px;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(64, 158, 255, 0.3);

    .info-item {
      display: flex;
      align-items: center;
      margin-bottom: 4px;

      &:last-child {
        margin-bottom: 0;
      }

      .info-label {
        font-size: 12px;
        margin-right: 4px;
      }

      .info-value {
        font-size: 14px;
        font-weight: 600;
        margin-right: 2px;
      }

      .info-unit {
        font-size: 12px;
      }
    }
  }
}
</style>
