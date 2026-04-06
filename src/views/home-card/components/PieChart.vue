/**
 * 饼状图组件
 * @component
 * @description 用于展示饼状数据，支持自动刷新和排序
 * @props {Object} info - 组件配置信息
 * @props {string} info.CHART_CONFIG - JSON格式的配置字符串，包含pieChartCategory、pieChartValue等字段
 * @props {string} info.CHART_CONFIG.pieChartCategory - 分类字段名
 * @props {string} info.CHART_CONFIG.pieChartValue - 值字段名
 * @example <PieChart :info="item" />
 */
<template>
  <div class="pie-chart" ref="chartRef"></div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from "vue";
import * as echarts from "echarts";
import api from '@/api/index';

const props = defineProps({
  info: {
    type: Object,
    default: () => ({})
  },
  params: {
    type: Object,
    default: () => ({})
  }
});

const chartRef = ref(null);
let chartInstance = null;
const localSeriesData = ref([]);
const refreshInterval = ref(null);
const refreshEnabled = ref(true);
const intervalTime = ref(5); // 默认5秒

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
  // 清除现有的定时器
  if (refreshInterval.value) {
    clearInterval(refreshInterval.value);
  }
  
  // 如果启用了自动刷新，设置新的定时器
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
  const currentSqlId = props.info?.sqlId || props.info?.SQL_ID;
  if (!currentSqlId) return;
  
  try {
    const response = await api.executeData(currentSqlId, props.params);
    console.log('PieChart data:', response);
    console.log('PieChart info:', props.info);
    
    // 转换数据格式
    if (response && Array.isArray(response) && response.length > 0) {
      const data = JSON.parse(response[0].DATA || '[]');
      
      // 从CHART_CONFIG获取配置
      let chartConfig = null;
      try {
        chartConfig = props.info?.CHART_CONFIG ? JSON.parse(props.info.CHART_CONFIG) : null;
      } catch (e) {
        console.error('Failed to parse CHART_CONFIG:', e);
      }
      
      // 获取饼状图配置（支持大小写不敏感）
      const categoryField = chartConfig?.pieChartCategory || props.info?.PIE_CHART_CATEGORY || props.info?.pie_chart_category || '';
      const valueField = chartConfig?.pieChartValue || props.info?.PIE_CHART_VALUE || props.info?.pie_chart_value || '';
      
      if (!categoryField || !valueField) {
        localSeriesData.value = [];
        updateChart();
        return;
      }
      
      // 提取数据并汇总（相同类别的数据相加）
      const pieData = {};
      let totalValue = 0;
      data.forEach(item => {
        const category = item[categoryField] || '未知';
        const value = parseFloat(item[valueField]) || 0;
        if (!pieData[category]) {
          pieData[category] = 0;
        }
        pieData[category] += value;
        pieData[category] = parseFloat(pieData[category].toFixed(2));
        totalValue += value;
      });
      totalValue = parseFloat(totalValue.toFixed(2));
      
      // 转换为数组格式
      const seriesData = Object.keys(pieData).map(key => {
        const value = pieData[key];
        const percent = totalValue > 0 ? parseFloat(((value / totalValue) * 100).toFixed(2)) : 0;
        return {
          name: key,
          value: value,
          percent: percent
        };
      });
      
      // 解析排序配置
      const sortConfig = chartConfig?.pieChartSort || props.info?.PIE_CHART_SORT || '';
      if (sortConfig) {
        const sortOrder = sortConfig === 'asc' ? 'asc' : 'desc';
        seriesData.sort((a, b) => {
          return sortOrder === 'asc' ? a.value - b.value : b.value - a.value;
        });
      }
      
      localSeriesData.value = seriesData;
      updateChart();
    }
  } catch (error) {
    console.error('Failed to fetch PieChart data:', error);
  }
};

const initChart = () => {
  if (!chartRef.value) return;
  chartInstance = echarts.init(chartRef.value);
  updateChart();
  
  window.addEventListener("resize", handleResize);
  // 监听主题变化
  window.addEventListener("themeChange", updateChart);
  
  // 加载刷新设置
  loadRefreshSettings();
  
  // 设置自动刷新
  setupAutoRefresh();
  
  // 监听刷新设置变化
  window.addEventListener('refresh-settings-updated', handleRefreshSettingsChange);
};

const updateChart = () => {
  if (!chartInstance) return;
  
  const seriesData = localSeriesData.value;
  
  // 使用默认颜色
  const primaryColor = '#409EFF';
  const bgColor = '#ffffff';
  
  // 从CHART_CONFIG获取配置
  let chartConfig = null;
  try {
    chartConfig = props.info?.CHART_CONFIG ? JSON.parse(props.info.CHART_CONFIG) : null;
  } catch (e) {
    console.error('Failed to parse CHART_CONFIG:', e);
  }
  
  // 获取饼状图配置（支持大小写不敏感）
  const categoryField = chartConfig?.pieChartCategory || props.info?.PIE_CHART_CATEGORY || props.info?.pie_chart_category || '';
  const valueField = chartConfig?.pieChartValue || props.info?.PIE_CHART_VALUE || props.info?.pie_chart_value || '';
  
  if (!categoryField || !valueField) {
    // 无配置时显示提示信息
    const option = {
      backgroundColor: 'transparent',
      title: {
        text: '未配置饼状图参数',
        textStyle: {
          color: primaryColor
        }
      },
      series: []
    };
    chartInstance.setOption(option, true);
    return;
  }
  
  // 生成颜色列表
  const colors = [primaryColor, '#ff7875', '#52c41a', '#faad14', '#722ed1', '#13c2c2', '#eb2f96', '#fa8c16'];
  
  // 使用默认文字颜色
  const labelColor = '#303133';
  
  const option = {
    backgroundColor: 'transparent',
    animation: true,
    legend: {
      data: seriesData.map(item => item.name),
      textStyle: {
        color: primaryColor,
        fontSize: 8
      },
      right: 0,
      top: 'center',
      orient: 'vertical',
      itemWidth: 10,
      itemHeight: 10,
      itemGap: 6,
      formatter: function(name) {
        const item = seriesData.find(item => item.name === name);
        return `${name}: ${item.value}`;
      }
    },
    tooltip: {
      trigger: 'item',
      backgroundColor: bgColor,
      borderColor: primaryColor,
      textStyle: {
        color: primaryColor,
        fontSize: 9
      },
      formatter: '{b}: {c} ({d}%)'
    },
    series: [{
      name: categoryField,
      type: 'pie',
      radius: ['45%', '75%'],
      center: ['35%', '50%'],
      avoidLabelOverlap: false,
      itemStyle: {
        borderRadius: 4,
        borderColor: bgColor,
        borderWidth: 1
      },
      label: {
        show: true,
        position: 'inside',
        formatter: function(params) {
          return params.name;
        },
        color: labelColor,
        fontSize: 9,
        fontWeight: 'bold'
      },
      emphasis: {
        label: {
          show: true,
          fontSize: 11,
          fontWeight: 'bold',
          color: labelColor
        }
      },
      labelLine: {
        show: false
      },
      data: seriesData.map((item, index) => ({
        value: item.value,
        name: item.name,
        itemStyle: {
          color: colors[index % colors.length]
        }
      }))
    }]
  };
  
  chartInstance.setOption(option, true);
  // 调整图表大小
  chartInstance.resize();
};

const handleResize = () => {
  chartInstance?.resize();
};

watch(
  () => props.info?.sqlId || props.info?.SQL_ID,
  (newSqlId) => {
    if (newSqlId) {
      fetchData();
    }
  }
);

watch(
  () => {
    // 监听CHART_CONFIG和PIE_CHART配置的变化
    let chartConfig = null;
    try {
      chartConfig = props.info?.CHART_CONFIG ? JSON.parse(props.info.CHART_CONFIG) : null;
    } catch (e) {
      return props.info?.PIE_CHART_CATEGORY;
    }
    return chartConfig?.pieChartCategory || props.info?.PIE_CHART_CATEGORY;
  },
  () => {
    if (props.info?.SQL_ID) {
      fetchData();
    }
  }
);

// 处理tab切换
const handleTabChange = () => {
  setTimeout(() => {
    chartInstance?.resize();
  }, 100);
};

onMounted(() => {
  initChart();
  if (props.info?.SQL_ID) {
    fetchData();
  }
  // 监听tab切换事件
  window.addEventListener('tab-changed', handleTabChange);
});

onUnmounted(() => {
  window.removeEventListener("resize", handleResize);
  window.removeEventListener("themeChange", updateChart);
  window.removeEventListener('refresh-settings-updated', handleRefreshSettingsChange);
  window.removeEventListener('tab-changed', handleTabChange);
  
  // 清理定时器
  if (refreshInterval.value) {
    clearInterval(refreshInterval.value);
  }
  
  chartInstance?.dispose();
});
</script>

<style lang="scss" scoped>
.pie-chart {
  width: 100%;
  height: 100%;
  min-height: 200px;
}
</style>
