/**
 * 柱状图组件（home-table专用）
 * @component
 * @description 用于展示柱状图数据，接收父组件传递的数据
 * @props {Object} info - 组件配置信息
 * @props {string} info.barChartX - X轴字段名
 * @props {string} info.barChartY - Y轴字段名，多个字段用"|"分隔
 * @props {Array} data - 图表数据数组
 * @example <BarChart :info="tab" :data="chartData" />
 */
<template>
  <div class="bar-chart" ref="chartRef"></div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from "vue";
import * as echarts from "echarts";

const props = defineProps({
  info: {
    type: Object,
    default: () => ({})
  },
  data: {
    type: Array,
    default: () => []
  }
});

const chartRef = ref(null);
let chartInstance = null;

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

  // 强制调整大小，确保图表占满容器
  setTimeout(() => {
    chartInstance?.resize();
  }, 100);

  window.addEventListener('resize', handleResize);
  window.addEventListener('themeChange', updateChart);
};

const updateChart = () => {
  if (!chartInstance) return;

  const data = props.data || [];

  // 使用默认颜色
  const primaryColor = '#409EFF';
  const borderColor = '#dcdfe6';
  const bgColor = '#ffffff';

  // 获取柱状图配置
  const xAxisField = props.info?.barChartX || '';
  const yAxisFields = (props.info?.barChartY || '').split('|').filter(field => field);

  if (!xAxisField || yAxisFields.length === 0 || data.length === 0) {
    // 无配置或数据时显示提示信息
    const option = {
      backgroundColor: 'transparent',
      title: {
        text: '未配置柱状图参数或无数据',
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
        yData[xValue] = parseFloat(yData[xValue].toFixed(2));
      }
    });

    return {
      name: yField,
      data: yData
    };
  });

  // 解析排序配置
  const sortConfig = props.info?.barChartXSort || '';
  let sortType = 'field';
  let sortField = '';
  let sortOrder = 'desc';

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
    xAxisData.sort((a, b) => {
      const dateA = parseDate(a);
      const dateB = parseDate(b);

      if (dateA !== null && dateB !== null) {
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
      }
      return sortOrder === 'asc' ? a.localeCompare(b) : b.localeCompare(a);
    });
  } else if (sortType === 'field' && sortField) {
    const targetSeries = series.find(s => s.name === sortField);
    if (targetSeries) {
      xAxisData.sort((a, b) => {
        const valueA = targetSeries.data[a] || 0;
        const valueB = targetSeries.data[b] || 0;
        return sortOrder === 'asc' ? valueA - valueB : valueB - valueA;
      });
    }
  } else {
    if (series.length > 0) {
      const firstSeries = series[0];
      xAxisData.sort((a, b) => {
        const valueA = firstSeries.data[a] || 0;
        const valueB = firstSeries.data[b] || 0;
        return valueB - valueA;
      });
    }
  }

  // 按排序后的X轴整理系列数据
  const sortedSeries = series.map((seriesItem, index) => {
    const sortedYData = xAxisData.map(xValue => seriesItem.data[xValue] || 0);

    return {
      name: seriesItem.name,
      type: 'bar',
      data: sortedYData,
      itemStyle: {
        color: colors[index % colors.length]
      },
      barWidth: '40%',
      barGap: '10%',
      barCategoryGap: '20%'
    };
  });

  // 图表配置
  const option = {
    backgroundColor: 'transparent',
    animation: true,
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow',
        label: {
          backgroundColor: bgColor,
          borderColor: primaryColor,
          color: primaryColor,
          fontSize: 9
        }
      },
      backgroundColor: bgColor,
      borderColor: primaryColor,
      textStyle: {
        color: primaryColor,
        fontSize: 9
      }
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
  // 确保图表占满容器
  chartInstance.resize();
  
  // 再次调整大小，确保图表完全适应容器
  setTimeout(() => {
    chartInstance?.resize();
  }, 50);
};

const handleResize = () => {
  chartInstance?.resize();
};

// 监听数据变化
watch(
  () => props.data,
  () => {
    updateChart();
  },
  { deep: true }
);

// 监听配置变化
watch(
  () => [props.info?.barChartX, props.info?.barChartY],
  () => {
    updateChart();
  }
);

onMounted(() => {
  initChart();
  updateChart();
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
  window.removeEventListener('themeChange', updateChart);
  chartInstance?.dispose();
});
</script>

<style lang="scss" scoped>
.bar-chart {
  width: 100%;
  height: 100%;
  min-height: 150px;
  max-height: 100%;
}
</style>
