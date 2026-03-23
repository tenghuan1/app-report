/**
 * 数字翻牌器组件
 * @component
 * @description 用于展示数字数据，支持自动刷新和数字翻转动画
 * @props {Object} info - 组件配置信息
 * @props {string} info.CHART_CONFIG - JSON格式的配置字符串，包含digitalCardColumns字段
 * @props {string} info.CHART_CONFIG.digitalCardColumns - 配置列，格式为"字段1/对比字段1|字段2/对比字段2"
 * @example <DigitalCard :info="item" />
 */
<template>
  <div class="digital-card-container" :class="containerClass">
    <div
      v-for="(item, index) in displayData"
      :key="index"
      class="digital-card-item"
      :style="{ borderColor: item.borderColor || '#00d4ff' }"
      :ref="el => cardRefs[index] = el"
    >
      <div class="card-header">
        <div class="card-title">{{ item.title }}</div>
        <div v-if="item.compare" class="card-compare" :class="item.compare.type">
          {{ item.compare.type === 'increase' ? '↑' : '↓' }} {{ item.compare.value }}%
        </div>
        <div v-if="item.icon" class="card-icon">
          <i :class="item.icon"></i>
        </div>
      </div>
      <div class="card-body">
        <div class="card-value" :style="{ color: item.color || '#00d4ff' }">
          <span 
            class="number-display" 
            :style="{ fontSize: calculateFontSize(index, animatedValues[index] || item.value) }"
          >
            {{ animatedValues[index] || item.value }}
          </span>
          <span v-if="item.unit" class="card-unit">{{ item.unit }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick, onUnmounted } from 'vue';
import api from '@/api/index';

const props = defineProps({
  info: {
    type: Object,
    default: () => ({})
  }
});

const localData = ref([]);
const refreshInterval = ref(null);
const refreshEnabled = ref(true);
const intervalTime = ref(5); // 默认5秒
const displayOffset = ref({}); // 用于存储每个卡片的显示偏移量

const containerClass = computed(() => {
  const count = displayData.value.length;
  if (count === 1) {
    return 'single-card';
  } else if (count === 2) {
    return 'two-cards';
  } else if (count === 3) {
    return 'three-cards';
  } else if (count === 4) {
    return 'four-cards';
  }
  return '';
});

const displayData = computed(() => {
  return localData.value;
});

const animatedValues = ref([]);
const cardRefs = ref([]);
const cardWidths = ref([]);

const calculateFontSize = (index, value) => {
  const valueStr = String(value);
  const length = valueStr.length;
  
  let baseFontSize = 40;
  const minFontSize = 14;
  
  const cardWidth = cardWidths.value[index];
  if (cardWidth) {
    if (cardWidth < 120) {
      baseFontSize = 24;
    } else if (cardWidth < 160) {
      baseFontSize = 28;
    } else if (cardWidth < 200) {
      baseFontSize = 32;
    }
  } else {
    const count = displayData.value.length;
    if (count === 4) {
      baseFontSize = 24;
    } else if (count === 3) {
      baseFontSize = 28;
    } else if (count === 2) {
      baseFontSize = 32;
    }
  }
  
  if (length <= 3) {
    return `${baseFontSize}px`;
  }
  
  const reduction = (length - 3) * 2;
  const fontSize = Math.max(baseFontSize - reduction, minFontSize);
  
  return `${fontSize}px`;
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

// 数字翻转动画
const animateValue = (index, start, end, duration) => {
  const startTime = performance.now();
  const animate = (currentTime) => {
    const elapsed = (currentTime - startTime) / 1000;
    const progress = Math.min(elapsed / duration, 1);
    const easeProgress = easeOutCubic(progress);
    const current = start + (end - start) * easeProgress;
    
    animatedValues.value[index] = Math.round(current * 100) / 100;
    
    if (progress < 1) {
      requestAnimationFrame(animate);
    }
  };
  requestAnimationFrame(animate);
};

const easeOutCubic = (t) => {
  return 1 - Math.pow(1 - t, 3);
};

// 计算对比值
const calculateCompare = (current, previous) => {
  if (!previous || previous === 0) {
    return null;
  }
  const diff = current - previous;
  const percentage = ((diff / previous) * 100).toFixed(2);
  return {
    type: diff > 0 ? 'increase' : 'decrease',
    value: Math.abs(parseFloat(percentage))
  };
};

// 从后台获取数据
const fetchData = async () => {
  const currentSqlId = props.info?.SQL_ID || props.sqlId;
  if (!currentSqlId) return;
  
  try {
    const response = await api.executeData(currentSqlId, {});
    console.log('DigitalCard data:', response);
    
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
      
      // 如果没有CHART_CONFIG，使用默认配置
      const columnsConfig = chartConfig?.digitalCardColumns ||'';
      const columns = columnsConfig.split('|').filter(col => col.trim());
      
      // 按列计算总数
      const result = [];
      columns.forEach((columnConfig, index) => {
        const parts = columnConfig.split('/');
        const currentColumn = parts[0];
        const oldColumn = parts[1];
        
        // 计算当前值总和
        const currentTotal = data.reduce((sum, item) => {
          return sum + (parseFloat(item[currentColumn]) || 0);
        }, 0);
        
        // 每次刷新增加100，用于测试翻牌效果
        // 使用displayOffset来跟踪每个卡片的偏移量
        const key = `${currentColumn}_${index}`;
        if (!displayOffset.value[key]) {
          displayOffset.value[key] = 0;
        }
        displayOffset.value[key] += 100;
        const displayTotal = currentTotal + displayOffset.value[key];
        
        // 计算对比值
        let compare = null;
        if (oldColumn) {
          // 计算旧值总和
          const oldTotal = data.reduce((sum, item) => {
            return sum + (parseFloat(item[oldColumn]) || 0);
          }, 0);
          compare = calculateCompare(displayTotal, oldTotal);
        }
        
        result.push({
          title: currentColumn,
          value: parseFloat(displayTotal.toFixed(2)),
          unit: '',
          color: '',
          borderColor: '',
          icon: '',
          animationDuration: 2,
          compare: compare
        });
      });
      
      localData.value = result;
      
      // 触发数字翻转动画
      localData.value.forEach((item, index) => {
        const startValue = animatedValues.value[index] || 0;
        animateValue(index, startValue, item.value, item.animationDuration || 2);
      });
    }
  } catch (error) {
    console.error('Failed to fetch DigitalCard data:', error);
  }
};

onMounted(() => {
  if (props.sqlId || props.info?.SQL_ID) {
    fetchData();
  }
  
  // 加载刷新设置
  loadRefreshSettings();
  
  // 设置自动刷新
  setupAutoRefresh();
  
  // 监听刷新设置变化
  window.addEventListener('refresh-settings-updated', handleRefreshSettingsChange);
  
  nextTick(() => {
    updateCardWidths();
  });
});

onUnmounted(() => {
  // 清理定时器
  if (refreshInterval.value) {
    clearInterval(refreshInterval.value);
  }
  
  // 移除事件监听
  window.removeEventListener('refresh-settings-updated', handleRefreshSettingsChange);
});

const updateCardWidths = () => {
  cardRefs.value.forEach((ref, index) => {
    if (ref) {
      cardWidths.value[index] = ref.offsetWidth;
    }
  });
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
    // 监听CHART_CONFIG和DIGITAL_CARD_COLUMNS的变化
    let chartConfig = null;
    try {
      chartConfig = props.info?.CHART_CONFIG ? JSON.parse(props.info.CHART_CONFIG) : null;
    } catch (e) {
      return props.info?.DIGITAL_CARD_COLUMNS;
    }
    return chartConfig?.DIGITAL_CARD_COLUMNS || props.info?.DIGITAL_CARD_COLUMNS;
  },
  () => {
    if (props.info?.SQL_ID) {
      fetchData();
    }
  }
);
</script>

<style lang="scss" scoped>
* {
  box-sizing: border-box;
}

.digital-card-container {
  display: grid;
  gap: 6px;
  padding: 4px;
  width: 100%;
  height: 100%;
  box-sizing: border-box;

  &.single-card {
    grid-template-columns: 1fr;
    grid-template-rows: 1fr;
  }

  &.two-cards {
    grid-template-columns: repeat(2, 1fr);
    grid-template-rows: 1fr;
  }

  &.three-cards {
    grid-template-columns: repeat(3, 1fr);
    grid-template-rows: 1fr;
  }

  &.four-cards {
    grid-template-columns: repeat(2, 1fr);
    grid-template-rows: repeat(2, 1fr);
  }
}

.digital-card-item {
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  background: #ffffff;
  padding: 6px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 100%;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.15);
  transition: all 0.3s ease;
  overflow: hidden;
  box-sizing: border-box;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(64, 158, 255, 0.25);
  }
}

.card-value {
  font-weight: bold;
  display: flex;
  align-items: baseline;
  gap: 4px;
  max-width: 100%;
  overflow: hidden;
  flex-wrap: nowrap;
}

.number-display {
  font-family: 'Courier New', monospace;
  letter-spacing: 0.5px;
  white-space: nowrap;
  transition: font-size 0.3s ease;
  text-overflow: ellipsis;
  overflow: hidden;
  flex-shrink: 1;
  min-width: 0;
  color: #409EFF;
  font-weight: 900;
}

.card-unit {
  font-size: 14px;
  color: #409EFF;
  opacity: 0.7;
  font-weight: normal;
  flex-shrink: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
  flex-shrink: 0;
  gap: 8px;
  flex-wrap: nowrap;
  overflow: hidden;
}

.card-title {
  font-size: 12px;
  color: #303133;
  font-weight: bold;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex-shrink: 1;
  max-width: 60%;
}

.card-compare {
  font-size: 12px;
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: 2px;
  flex-shrink: 0;
  white-space: nowrap;

  &.increase {
    color: #52c41a;
  }

  &.decrease {
    color: #ff7875;
  }
}

.card-icon {
  font-size: 16px;
  color: #409EFF;
  opacity: 0.7;
  flex-shrink: 0;
}

.card-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  min-height: 0;
  gap: 4px;
}
</style>
