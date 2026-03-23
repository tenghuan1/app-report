/**
* 百分比带排名组件
* @component
* @description 用于展示百分比数据和两个排名轮播表
* @props {Object} info - 组件配置信息
* @props {string} info.SQL_ID - SQL查询ID，用于获取数据
* @props {string} info.CHART_CONFIG - JSON格式的配置字符串，包含相关配置
* @props {string} info.CHART_CONFIG.title - 组件标题，默认为'数据统计情况'
* @props {Object} info.CHART_CONFIG.percentage - 百分比配置
* @props {string} info.CHART_CONFIG.percentage.sqlId - 百分比数据查询SQL ID
* @props {string} info.CHART_CONFIG.percentage.field - 百分比字段名，默认为'value'
* @props {string} info.CHART_CONFIG.percentage.label - 百分比标签，默认为'数据占比'
* @props {Object} info.CHART_CONFIG.topItems - 排名靠前项配置
* @props {string} info.CHART_CONFIG.topItems.sqlId - 数据查询SQL ID
* @props {string} info.CHART_CONFIG.topItems.rankingName - 排名名称字段
* @props {string} info.CHART_CONFIG.topItems.rankingCount - 排名数值字段，格式为"字段名:排序方式(asc/desc)"
* @props {string} info.CHART_CONFIG.topItems.title - 标题，默认为'排名靠前项'
* @props {Object} info.CHART_CONFIG.bottomItems - 排名靠后项配置
* @props {string} info.CHART_CONFIG.bottomItems.sqlId - 数据查询SQL ID
* @props {string} info.CHART_CONFIG.bottomItems.rankingName - 排名名称字段
* @props {string} info.CHART_CONFIG.bottomItems.rankingCount - 排名数值字段，格式为"字段名:排序方式(asc/desc)"
* @props {string} info.CHART_CONFIG.bottomItems.title - 标题，默认为'排名靠后项'
* @props {Object} info.CHART_CONFIG.topDepartments - 排名靠前项配置（向后兼容，优先使用topItems）
* @props {Object} info.CHART_CONFIG.bottomDepartments - 排名靠后项配置（向后兼容，优先使用bottomItems）
* @example
* <PercentageWithRankingsComponent :info="item" />
* // CHART_CONFIG示例
* // {
* //   "title": "床位使用率情况",
* //   "percentage": {
* //     "sqlId": "bed_usage_rate",
* //     "field": "usageRate",
* //     "label": "床位使用率"
* //   },
* //   "topItems": {
* //     "sqlId": "home6",
* //     "rankingName": "姓名",
* //     "rankingCount": "总金额:desc",
* //     "title": "床位使用率排名靠前科室"
* //   },
* //   "bottomItems": {
* //     "sqlId": "home7",
* //     "rankingName": "姓名",
* //     "rankingCount": "总金额:asc",
* //     "title": "床位使用率排名靠后科室"
* //   }
* // }
*/
<template>
  <div class="percentage-with-rankings-component">
    <!-- <div class="component-title">{{ title }}</div> -->
    
    <div class="percentage-section">
      <div class="percentage-label">{{ title }}</div>
      <div class="rate-bar">
        <div class="rate-fill" :style="{ width: percentageValue + '%' }"></div>
      </div>
      <div class="rate-value">{{ percentageValue }}%</div>
    </div>
    
    <div class="rankings-section">
      <div class="ranking-table">
        <div class="table-title">
          <div class="title-icon up"></div>
          {{ topItemsConfig.title }}
        </div>
        <RankingBoard :info="{ 
          SQL_ID: topItemsConfig.sqlId, 
          RANKING_NAME: topItemsConfig.rankingName, 
          RANKING_COUNT: topItemsConfig.rankingCount 
        }" />
      </div>
      
      <div class="ranking-table">
        <div class="table-title">
          <div class="title-icon down"></div>
          {{ bottomItemsConfig.title }}
        </div>
        <RankingBoard :info="{ 
          SQL_ID: bottomItemsConfig.sqlId, 
          RANKING_NAME: bottomItemsConfig.rankingName, 
          RANKING_COUNT: bottomItemsConfig.rankingCount 
        }" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import RankingBoard from './RankingBoard.vue';
import api from '@/api/index';

const props = defineProps({
  info: {
    type: Object,
    default: () => ({})
  }
});

const percentageData = ref(0);
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
const title = computed(() => chartConfig.value.title || '数据统计情况');
const percentageConfig = computed(() => chartConfig.value.percentage || {
  sqlId: '',
  field: 'value',
  label: '数据占比'
});
const topItemsConfig = computed(() => {
  // 优先使用topItems，其次使用topDepartments（向后兼容）
  const config = chartConfig.value.topItems || chartConfig.value.topDepartments || {};
  return {
    sqlId: '',
    rankingName: '名称',
    rankingCount: '数值:desc',
    title: '排名靠前项',
    ...config
  };
});
const bottomItemsConfig = computed(() => {
  // 优先使用bottomItems，其次使用bottomDepartments（向后兼容）
  const config = chartConfig.value.bottomItems || chartConfig.value.bottomDepartments || {};
  return {
    sqlId: '',
    rankingName: '名称',
    rankingCount: '数值:asc',
    title: '排名靠后项',
    ...config
  };
});

// 计算属性
const percentageValue = computed(() => {
  return percentageData.value.toFixed(2);
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
      fetchPercentageData();
    }, intervalTime.value * 1000);
  }
};

// 刷新设置变化处理函数
const handleRefreshSettingsChange = () => {
  loadRefreshSettings();
  setupAutoRefresh();
};

// 从后台获取百分比数据
const fetchPercentageData = async () => {
  const sqlId = percentageConfig.value.sqlId;
  if (!sqlId) return;
  
  try {
    const response = await api.executeData(sqlId, {});
    console.log('PercentageWithRankingsComponent percentage data:', response);
    
    if (response && Array.isArray(response) && response.length > 0) {
      const data = JSON.parse(response[0].DATA || '[]');
      if (data && data.length > 0) {
        const value = parseFloat(data[0][percentageConfig.value.field]) || 0;
        percentageData.value = value;
      }
    }
  } catch (error) {
    console.error('Failed to fetch PercentageWithRankingsComponent percentage data:', error);
  }
};

onMounted(() => {
  loadRefreshSettings();
  setupAutoRefresh();
  window.addEventListener('refresh-settings-updated', handleRefreshSettingsChange);
  
  // 初始加载数据
  fetchPercentageData();
});

onUnmounted(() => {
  window.removeEventListener('refresh-settings-updated', handleRefreshSettingsChange);
  
  if (refreshInterval.value) {
    clearInterval(refreshInterval.value);
  }
});
</script>

<style lang="scss" scoped>
.percentage-with-rankings-component {
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  padding: 16px;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border: 1px solid #e8f4ff;
  display: flex;
  flex-direction: column;

  .component-title {
    font-size: 16px;
    font-weight: 600;
    color: #303133;
    margin-bottom: 16px;
    padding-bottom: 8px;
    border-bottom: 1px solid #e8f4ff;
  }

  .percentage-section {
    margin-bottom: 12px;
    display: flex;
    align-items: center;
    gap: 12px;

    .percentage-label {
      font-size: 12px;
      color: #606266;
      white-space: nowrap;
    }

    .rate-bar {
      flex: 1;
      height: 6px;
      background: #e8f4ff;
      border-radius: 3px;
      overflow: hidden;

      .rate-fill {
        height: 100%;
        background: linear-gradient(90deg, #409EFF, #1976D2);
        transition: width 0.5s ease;
      }
    }

    .rate-value {
      font-size: 12px;
      font-weight: 500;
      color: #409EFF;
      min-width: 50px;
      text-align: right;
    }
  }

  .rankings-section {
    flex: 1;
    display: flex;
    gap: 16px;

    .ranking-table {
      flex: 1;
      display: flex;
      flex-direction: column;

      .table-title {
        display: flex;
        align-items: center;
        font-size: 14px;
        font-weight: 500;
        color: #303133;
        margin-bottom: 8px;
        padding: 8px 12px;
        background: linear-gradient(135deg, #409EFF, #1976D2);
        color: #ffffff;
        border-radius: 8px;
        min-height: 36px;
        box-sizing: border-box;

        .title-icon {
          width: 16px;
          height: 16px;
          margin-right: 8px;
          border-left: 4px solid currentColor;
          border-top: 4px solid currentColor;
          transform: rotate(45deg);

          &.down {
            transform: rotate(225deg);
          }
        }
      }

      :deep(.ranking-board-container) {
        flex: 1;
      }
    }
  }
}
</style>
