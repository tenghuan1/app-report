/**
 * 折线图组件
 * @component
 * @description 用于展示折线数据，支持自动刷新和排序
 * @props {Object} info - 组件配置信息
 * @props {string} info.CHART_CONFIG - JSON格式的配置字符串，包含lineChartX、lineChartY等字段
 * @props {string} info.CHART_CONFIG.lineChartX - X轴字段名
 * @props {string} info.CHART_CONFIG.lineChartY - Y轴字段名，多个字段用"|"分隔
 * @props {string} info.CHART_CONFIG.lineChartXSort - X轴排序配置，格式为"x:asc/desc"或"field:字段名:asc/desc"
 * @example <LineChart :info="item" />
 */
<template>
  <div class="line-chart" ref="chartRef"></div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from "vue";
import * as echarts from "echarts";
import api from '@/api/index';

const props = defineProps({
  info: {
    type: Object,
    default: () => ({})
  }
});

const chartRef = ref(null);
let chartInstance = null;
const localData = ref([]);
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
  const currentSqlId = props.info?.SQL_ID;
  if (!currentSqlId) return;

  try {
    const response = await api.executeData(currentSqlId, {});
    console.log('LineChart data:', response);

    if (response && Array.isArray(response) && response.length > 0) {
      localData.value = JSON.parse(response[0].DATA || '[]');
      console.log('LineChart data:-----', localData.value);
      updateChart();
    }
  } catch (error) {
    console.error('Failed to fetch LineChart data:', error);
  }
};

// 解析日期字符串
const parseDate = (dateStr) => {
  if (!dateStr || typeof dateStr !== 'string') {
    return null;
  }

  const date = new Date(dateStr);
  if (!isNaN(date.getTime())) {
    return date.getTime();
  }

  const patterns = [
    /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})$/,
    /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2})$/,
    /^(\d{4})-(\d{2})-(\d{2})$/,
    /^(\d{4})\/(\d{2})\/(\d{2}) (\d{2}):(\d{2}):(\d{2})$/,
    /^(\d{4})\/(\d{2})\/(\d{2}) (\d{2}):(\d{2})$/,
    /^(\d{4})\/(\d{2})\/(\d{2})$/,
    /^(\d{2})\/(\d{2})\/(\d{4})$/,
    /^(\d{2})-(\d{2})-(\d{4})$/
  ];

  for (const pattern of patterns) {
    const match = dateStr.match(pattern);
    if (match) {
      const [, part1, part2, part3, part4, part5, part6] = match;
      let year, month, day, hour, minute, second;

      if (pattern === patterns[0] || pattern === patterns[1] || pattern === patterns[2]) {
        year = parseInt(part1);
        month = parseInt(part2) - 1;
        day = parseInt(part3);
        hour = part4 ? parseInt(part4) : 0;
        minute = part5 ? parseInt(part5) : 0;
        second = part6 ? parseInt(part6) : 0;
      } else if (pattern === patterns[3] || pattern === patterns[4] || pattern === patterns[5]) {
        year = parseInt(part1);
        month = parseInt(part2) - 1;
        day = parseInt(part3);
        hour = part4 ? parseInt(part4) : 0;
        minute = part5 ? parseInt(part5) : 0;
        second = part6 ? parseInt(part6) : 0;
      } else if (pattern === patterns[6]) {
        day = parseInt(part1);
        month = parseInt(part2) - 1;
        year = parseInt(part3);
      } else if (pattern === patterns[7]) {
        month = parseInt(part1) - 1;
        day = parseInt(part2);
        year = parseInt(part3);
      }

      const parsedDate = new Date(year, month, day, hour || 0, minute || 0, second || 0);
      if (!isNaN(parsedDate.getTime())) {
        return parsedDate.getTime();
      }
    }
  }

  return null;
};

const initChart = () => {
  if (!chartRef.value) return;
  chartInstance = echarts.init(chartRef.value);
  updateChart();

  // 初始调整大小
  setTimeout(() => {
    chartInstance?.resize();
  }, 100);

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

  const data = localData.value;

  // 使用默认颜色
  const primaryColor = '#409EFF';
  const borderColor = '#dcdfe6';

  // 从CHART_CONFIG获取配置
  let chartConfig = null;
  try {
    chartConfig = props.info?.CHART_CONFIG ? JSON.parse(props.info.CHART_CONFIG) : null;
  } catch (e) {
    console.error('Failed to parse CHART_CONFIG:', e);
  }

  // 获取折线图配置
  const xAxisField = chartConfig?.lineChartX || props.info?.LINE_CHART_X || '';
  const yAxisFields = (chartConfig?.lineChartY || props.info?.LINE_CHART_Y || '').split('|').filter(field => field);

  if (!xAxisField || yAxisFields.length === 0) {
    // 无配置时显示提示信息
    const option = {
      backgroundColor: 'transparent',
      title: {
        text: '未配置折线图参数',
        textStyle: {
          color: primaryColor
        }
      },
      xAxis: {
        type: 'category',
        data: [],
        axisLine: {
          lineStyle: {
            color: borderColor
          }
        }
      },
      yAxis: {
        type: 'value',
        axisLine: {
          lineStyle: {
            color: borderColor
          }
        }
      },
      series: []
    };
    chartInstance.setOption(option, true);
    return;
  }

  // 提取X轴数据（去重）
  const xAxisData = [...new Set(data.map(item => item[xAxisField]).filter(value => value))];

  // 生成颜色列表
  const colors = [primaryColor, '#ff7875', '#52c41a', '#faad14', '#722ed1'];

  // 生成系列数据
  const series = yAxisFields.map((yField, index) => {
    // 提取Y轴数据并汇总（相同X轴值的数据相加）
    const yData = {};
    data.forEach(item => {
      const xValue = item[xAxisField];
      const yValue = parseFloat(item[yField]) || 0;
      if (xValue) {
        if (!yData[xValue]) {
          yData[xValue] = 0;
        }
        yData[xValue] += yValue;
        // 保留两位小数
        yData[xValue] = parseFloat(yData[xValue].toFixed(2));
      }
    });

    return {
      name: yField,
      data: yData
    };
  });

  // 解析排序配置
  const sortConfig = chartConfig?.lineChartXSort || '';
  let sortType = 'field'; // 'field' 或 'x'
  let sortField = '';
  let sortOrder = 'desc'; // 'asc' 或 'desc'

  if (sortConfig) {
    const parts = sortConfig.split(':');
    if (parts[0] === 'x') {
      sortType = 'x';
      sortOrder = parts[1] || 'desc';
    } else if (parts[0] === 'field') {
      sortType = 'field';
      sortField = parts[1] || '';
      sortOrder = parts[2] || 'desc';
    }
  }

  // 根据配置进行排序
  if (sortType === 'x') {
    // 按X轴排序
    xAxisData.sort((a, b) => {
      // 尝试解析日期字符串
      const dateA = parseDate(a);
      const dateB = parseDate(b);

      if (dateA !== null && dateB !== null) {
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
      }
      // 非日期按字符串排序
      return sortOrder === 'asc' ? a.localeCompare(b) : b.localeCompare(a);
    });
  } else if (sortType === 'field' && sortField) {
    // 按指定字段排序
    const targetSeries = series.find(s => s.name === sortField);
    if (targetSeries) {
      xAxisData.sort((a, b) => {
        const valueA = targetSeries.data[a] || 0;
        const valueB = targetSeries.data[b] || 0;
        return sortOrder === 'asc' ? valueA - valueB : valueB - valueA;
      });
    }
  } else {
    // 默认按第一个Y轴值倒序排列
    if (series.length > 0) {
      const firstSeries = series[0];
      xAxisData.sort((a, b) => {
        const valueA = firstSeries.data[a] || 0;
        const valueB = firstSeries.data[b] || 0;
        return valueB - valueA; // 倒序排列
      });
    }
  }

  // 按排序后的X轴整理系列数据
  const sortedSeries = series.map((seriesItem, index) => {
    const sortedYData = xAxisData.map(xValue => seriesItem.data[xValue] || 0);

    return {
      name: seriesItem.name,
      type: 'line',
      data: sortedYData,
      smooth: true,
      itemStyle: {
        color: colors[index % colors.length]
      },
      lineStyle: {
        color: colors[index % colors.length],
        width: 2
      },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          {
            offset: 0,
            color: colors[index % colors.length] + '4D' // 30%透明度
          },
          {
            offset: 1,
            color: colors[index % colors.length] + '1A' // 10%透明度
          }
        ])
      }
    };
  });

  // 图表配置
  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: yAxisFields,
      textStyle: {
        color: primaryColor,
        fontSize: 8
      },
      right: 5,
      top: 5,
      orient: 'horizontal',
      formatter: function (name) {
        return name;
      }
    },
    grid: {
      left: '3%',
      right: '8%',
      bottom: '15%',
      top: '20%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: xAxisData,
      axisLine: {
        lineStyle: {
          color: borderColor
        }
      },
      axisLabel: {
        color: primaryColor,
        fontSize: 9,
        rotate: 45
      }
    },
    yAxis: {
      type: 'value',
      axisLine: {
        lineStyle: {
          color: borderColor
        }
      },
      axisLabel: {
        color: primaryColor,
        fontSize: 9
      },
      splitLine: {
        lineStyle: {
          color: '#ebeef5'
        }
      }
    },
    series: sortedSeries
  };

  chartInstance.setOption(option, true);

  // 调整图表大小
  chartInstance.resize();

  // 延迟再次调整大小，确保容器尺寸稳定
  setTimeout(() => {
    chartInstance?.resize();
  }, 100);
};

const handleResize = () => {
  chartInstance?.resize();
};

watch(
  () => props.info?.SQL_ID,
  (newSqlId) => {
    if (newSqlId) {
      fetchData();
    }
  }
);

watch(
  () => {
    // 监听CHART_CONFIG和LINE_CHART配置的变化
    let chartConfig = null;
    try {
      chartConfig = props.info?.CHART_CONFIG ? JSON.parse(props.info.CHART_CONFIG) : null;
    } catch (e) {
      return props.info?.LINE_CHART_X;
    }
    return chartConfig?.lineChartX || props.info?.LINE_CHART_X;
  },
  () => {
    if (props.info?.SQL_ID) {
      fetchData();
    }
  }
);

onMounted(() => {
  initChart();
  if (props.info?.SQL_ID) {
    fetchData();
  }
});

onUnmounted(() => {
  window.removeEventListener("resize", handleResize);
  window.removeEventListener("themeChange", updateChart);
  window.removeEventListener('refresh-settings-updated', handleRefreshSettingsChange);

  // 清理定时器
  if (refreshInterval.value) {
    clearInterval(refreshInterval.value);
  }

  chartInstance?.dispose();
});
</script>

<style lang="scss" scoped>
.line-chart {
  width: 100%;
  height: 100%;
  min-height: 200px;
}
</style>
