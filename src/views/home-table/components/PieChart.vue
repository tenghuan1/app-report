/**
 * 饼状图组件（home-table专用）
 * @component
 * @description 用于展示饼状数据，接收父组件传递的数据
 * @props {Object} info - 组件配置信息
 * @props {string} info.pieChartCategory - 分类字段名
 * @props {string} info.pieChartValue - 值字段名
 * @props {Array} data - 图表数据数组
 * @example <PieChart :info="tab" :data="chartData" />
 */
<template>
  <div class="pie-chart" ref="chartRef"></div>
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

const initChart = () => {
  if (!chartRef.value) return;
  chartInstance = echarts.init(chartRef.value);
  updateChart();

  // 强制调整大小，确保图表占满容器
  setTimeout(() => {
    chartInstance?.resize();
  }, 100);

  window.addEventListener("resize", handleResize);
  window.addEventListener("themeChange", updateChart);
};

const updateChart = () => {
  if (!chartInstance) return;

  const data = props.data || [];

  // 使用默认颜色
  const primaryColor = '#409EFF';
  const bgColor = '#ffffff';

  // 获取饼状图配置
  const categoryField = props.info?.pieChartCategory || '';
  const valueField = props.info?.pieChartValue || '';

  if (!categoryField || !valueField || data.length === 0) {
    // 无配置或数据时显示提示信息
    const option = {
      backgroundColor: 'transparent',
      title: {
        text: '未配置饼状图参数或无数据',
        textStyle: {
          color: primaryColor
        }
      },
      series: []
    };
    chartInstance.setOption(option, true);
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
  let seriesData = Object.keys(pieData).map(key => {
    const value = pieData[key];
    const percent = totalValue > 0 ? parseFloat(((value / totalValue) * 100).toFixed(2)) : 0;
    return {
      name: key,
      value: value,
      percent: percent
    };
  });

  // 解析排序配置
  const sortConfig = props.info?.pieChartSort || '';
  if (sortConfig) {
    const sortOrder = sortConfig === 'asc' ? 'asc' : 'desc';
    seriesData.sort((a, b) => {
      return sortOrder === 'asc' ? a.value - b.value : b.value - a.value;
    });
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
  () => [props.info?.pieChartCategory, props.info?.pieChartValue],
  () => {
    updateChart();
  }
);

onMounted(() => {
  initChart();
  updateChart();
});

onUnmounted(() => {
  window.removeEventListener("resize", handleResize);
  window.removeEventListener("themeChange", updateChart);
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
