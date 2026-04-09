/**
 * 进度环组件
 * @component
 * @description 用于展示环形进度图，支持通过 SQL ID 查询数据，支持多个字段值和过滤条件
 * @props {string} sqlId - SQL查询ID
 * @props {string} valueField - 当前值字段名，默认为'value'
 * @props {string} totalField - 总值字段名，默认为'total'
 * @props {string} label - 进度环标签
 * @props {Array} fields - 多个字段配置，用于计算进度值
 * @props {string} fields[].name - 字段名
 * @props {string} fields[].func - 计算函数：SUM/AVG/MAX/MIN/COUNT
 * @props {Object} fields[].filter - 过滤条件
 * @props {string} fields[].filter.field - 要过滤的字段名
 * @props {string} fields[].filter.operator - 操作符：eq/ne/gt/lt/gte/lte/in/contains
 * @props {any} fields[].filter.value - 过滤值
 * @props {string} type - 计算类型，'percentage'表示百分比，'ratio'表示比率
 */
<template>
  <div class="progress-ring">
    <div class="ring-container" ref="ringRef">
      <svg class="ring-svg" viewBox="0 0 100 100">
        <!-- 定义渐变 -->
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style="stop-color:#4CAF50" />
            <stop offset="100%" style="stop-color:#8BC34A" />
          </linearGradient>
        </defs>
        <!-- 背景圆环 -->
        <circle class="ring-bg" cx="50" cy="50" r="40" />
        <!-- 进度圆环 -->
        <circle class="ring-progress" cx="50" cy="50" r="40" :style="progressStyle" />
      </svg>
      <div class="ring-percentage">{{ progressValue }}%</div>
      <div class="ring-label">{{ label }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue';
import api from '@/api/index';

const props = defineProps({
  sqlId: {
    type: String,
    required: true
  },
  valueField: {
    type: String,
    default: 'value'
  },
  totalField: {
    type: String,
    default: 'total'
  },
  label: {
    type: String,
    default: ''
  },
  // 多个字段配置，用于计算进度值
  fields: {
    type: Array,
    default: () => []
  },
  // 计算类型：'percentage'表示百分比，'ratio'表示比率
  type: {
    type: String,
    default: 'percentage'
  }
});

const progressValue = ref(0);
let refreshInterval = null;

// 计算进度样式
const progressStyle = computed(() => {
  const circumference = 2 * Math.PI * 40;
  const offset = circumference - (progressValue.value / 100) * circumference;
  return {
    strokeDasharray: `${circumference} ${circumference}`,
    strokeDashoffset: offset
  };
});

// 过滤数据
const filterData = (data, filterConfig) => {
  if (!filterConfig) return data;
  
  const { field, operator, value } = filterConfig;
  
  return data.filter(item => {
    const fieldValue = item[field];
    
    switch (operator?.toLowerCase()) {
      case 'eq':
      case 'equals':
        return fieldValue == value;
      case 'ne':
      case 'notequals':
        return fieldValue != value;
      case 'gt':
      case 'greaterthan':
        return parseFloat(fieldValue) > parseFloat(value);
      case 'lt':
      case 'lessthan':
        return parseFloat(fieldValue) < parseFloat(value);
      case 'gte':
      case 'greaterthanorequals':
        return parseFloat(fieldValue) >= parseFloat(value);
      case 'lte':
      case 'lessthanorequals':
        return parseFloat(fieldValue) <= parseFloat(value);
      case 'in':
        if (Array.isArray(value)) {
          return value.includes(fieldValue);
        }
        return String(fieldValue).includes(String(value));
      case 'contains':
        return String(fieldValue).includes(String(value));
      default:
        return true;
    }
  });
};

// 计算字段值
const calculateField = (data, fieldConfig) => {
  const { name, func, filter } = fieldConfig;
  
  // 先应用过滤条件
  const filteredData = filter ? filterData(data, filter) : data;
  
  // 获取字段值
  const values = filteredData.map(item => parseFloat(item[name]) || 0).filter(v => !isNaN(v));
  
  if (values.length === 0) return 0;
  
  switch (func?.toUpperCase()) {
    case 'MAX':
      return Math.max(...values);
    case 'MIN':
      return Math.min(...values);
    case 'SUM':
      return values.reduce((a, b) => a + b, 0);
    case 'AVG':
    case 'AVERAGE':
      return values.reduce((a, b) => a + b, 0) / values.length;
    case 'COUNT':
      return filteredData.length;
    default:
      return values[0];
  }
};

// 获取数据
const fetchData = async () => {
  if (!props.sqlId) return;
  
  try {
    const response = await api.executeData(props.sqlId, {});
    if (response && Array.isArray(response) && response.length > 0) {
      const data = response[0].DATA ?JSON.parse(response[0].DATA || '[]') : response;
      if (data.length > 0) {
        // 如果有 fields 配置，使用 fields 计算进度值
        if (props.fields && props.fields.length > 0) {
          const value = calculateField(data, props.fields[0]);
          const total = props.fields[1] ? calculateField(data, props.fields[1]) : 100;
          progressValue.value = Math.min(100, Math.round((value / total) * 100));
        } else {
          // 兼容旧的 valueField/totalField 配置
          const item = data[0];
          const value = parseFloat(item[props.valueField]) || 0;
          const total = parseFloat(item[props.totalField]) || 1;
          progressValue.value = Math.min(100, Math.round((value / total) * 100));
        }
      }
    }
  } catch (error) {
    console.error('Failed to fetch ProgressRing data:', error);
  }
};

// 设置自动刷新
const setupAutoRefresh = () => {
  if (refreshInterval) {
    clearInterval(refreshInterval);
  }
  refreshInterval = setInterval(() => {
    fetchData();
  }, 5000);
};

onMounted(() => {
  fetchData();
  setupAutoRefresh();
});

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval);
  }
});

// 监听 SQL ID 变化
watch(() => props.sqlId, () => {
  fetchData();
});
</script>

<style lang="scss" scoped>
.progress-ring {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;

  .ring-container {
    position: relative;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;

    .ring-svg {
      width: 100%;
      height: 100%;
      transform: rotate(-90deg);

      .ring-bg {
        fill: none;
        stroke: rgba(0, 0, 0, 0.1);
        stroke-width: 8;
      }

      .ring-progress {
        fill: none;
        stroke: url(#gradient);
        stroke-width: 8;
        stroke-linecap: round;
        transition: stroke-dashoffset 0.5s ease;
      }
    }

    .ring-percentage {
      position: absolute;
      font-size: 18px;
      font-weight: 600;
      color: #333;
    }

    .ring-label {
      position: absolute;
      bottom: 10%;
      font-size: 12px;
      color: #666;
    }
  }
}
</style>
