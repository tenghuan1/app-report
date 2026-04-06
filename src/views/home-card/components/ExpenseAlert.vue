/**
 * 出院患者费用预警组件
 * @component
 * @description 用于展示出院患者费用预警信息，包含文本描述和进度环
 * @props {Object} info - 组件配置信息
 * @props {string} info.CHART_CONFIG - JSON格式的配置字符串
 * @props {string} info.CHART_CONFIG.title - 组件标题
 * @props {Array} info.CHART_CONFIG.textList - 文本列表配置
 * @props {string} info.CHART_CONFIG.textList[].label - 标识名
 * @props {string} info.CHART_CONFIG.textList[].sqlId - 查询SQL ID
 * @props {string} info.CHART_CONFIG.textList[].format - 文本格式模板
 * @props {Array} info.CHART_CONFIG.textList[].fields - 字段配置数组
 * @props {string} info.CHART_CONFIG.textList[].fields[].name - 字段名
 * @props {string} info.CHART_CONFIG.textList[].fields[].func - 计算函数：MAX/MIN/SUM/AVG/COUNT
 * @props {Array} info.CHART_CONFIG.alertProgressList - 告警和进度环组合列表配置
 * @props {string} info.CHART_CONFIG.alertProgressList[].alert.label - 告警标签
 * @props {string} info.CHART_CONFIG.alertProgressList[].alert.sqlId - 查询SQL ID（与进度环共享）
 * @props {string} info.CHART_CONFIG.alertProgressList[].alert.format - 文本格式模板
 * @props {Array} info.CHART_CONFIG.alertProgressList[].alert.fields - 字段配置数组
 * @props {string} info.CHART_CONFIG.alertProgressList[].alert.fields[].name - 字段名
 * @props {string} info.CHART_CONFIG.alertProgressList[].alert.fields[].func - 计算函数：MAX/MIN/SUM/AVG/COUNT
 * @props {string} info.CHART_CONFIG.alertProgressList[].progress.label - 进度环标签
 * @props {string} info.CHART_CONFIG.alertProgressList[].progress.sqlId - 查询SQL ID（与告警共享）
 * @props {Array} info.CHART_CONFIG.alertProgressList[].progress.fields - 进度环字段配置数组
 * @props {string} info.CHART_CONFIG.alertProgressList[].progress.fields[].name - 字段名
 * @props {string} info.CHART_CONFIG.alertProgressList[].progress.fields[].func - 计算函数：SUM/AVG/MAX/MIN/COUNT
 * @props {Object} info.CHART_CONFIG.alertProgressList[].progress.fields[].filter - 过滤条件
 * @props {string} info.CHART_CONFIG.alertProgressList[].progress.fields[].filter.field - 要过滤的字段名
 * @props {string} info.CHART_CONFIG.alertProgressList[].progress.fields[].filter.operator - 操作符：eq/ne/gt/lt/gte/lte/in/contains
 * @props {any} info.CHART_CONFIG.alertProgressList[].progress.fields[].filter.value - 过滤值
 * 
 * @example
 * // CHART_CONFIG示例（告警和进度环组合配置，使用同一个SQL ID）
 * // {
 * //   "title": "出院患者费用预警",
 * //   "textList": [
 * //     {
 * //       "label": "次均",
 * //       "sqlId": "expense_average",
 * //       "format": "实际次均{实际次均}元，原定次均{原定次均}元，最长住院{最长住院}天",
 * //       "fields": [
 * //         {
 * //           "name": "实际次均",
 * //           "func": "AVG"
 * //         },
 * //         {
 * //           "name": "原定次均",
 * //           "func": "AVG"
 * //         },
 * //         {
 * //           "name": "最长住院",
 * //           "func": "MAX"
 * //         }
 * //       ]
 * //     },
 * //     {
 * //       "label": "提醒",
 * //       "sqlId": "expense_reminder",
 * //       "format": "未及时结算人数，最短超时已超过{最短超时}天",
 * //       "fields": [
 * //         {
 * //           "name": "最短超时",
 * //           "func": "MIN"
 * //         }
 * //       ]
 * //     }
 * //   ],
 * //   "alertProgressList": [
 * //     {
 * //       "alert": {
 * //         "label": "欠费超5000元",
 * //         "sqlId": "expense_medical",
 * //         "format": "{count}人",
 * //         "fields": [
 * //           {
 * //             "name": "count",
 * //             "func": "COUNT"
 * //           }
 * //         ]
 * //       },
 * //       "progress": {
 * //         "label": "医保",
 * //         "sqlId": "expense_medical",
 * //         "fields": [
 * //           {
 * //             "name": "amount",
 * //             "func": "SUM",
 * //             "filter": {
 * //               "field": "type",
 * //               "operator": "eq",
 * //               "value": "medical"
 * //             }
 * //           },
 * //           {
 * //             "name": "total",
 * //             "func": "SUM"
 * //           }
 * //         ]
 * //       }
 * //     },
 * //     {
 * //       "alert": {
 * //         "label": "欠费超30天",
 * //         "sqlId": "expense_self",
 * //         "format": "{count}人",
 * //         "fields": [
 * //           {
 * //             "name": "count",
 * //             "func": "COUNT"
 * //           }
 * //         ]
 * //       },
 * //       "progress": {
 * //         "label": "自费",
 * //         "sqlId": "expense_self",
 * //         "fields": [
 * //           {
 * //             "name": "amount",
 * //             "func": "SUM",
 * //             "filter": {
 * //               "field": "type",
 * //               "operator": "eq",
 * //               "value": "self"
 * //             }
 * //           },
 * //           {
 * //             "name": "total",
 * //             "func": "SUM"
 * //           }
 * //         ]
 * //       }
 * //     }
 * //   ]
 * // }
 * // 注：每个告警和进度环组合使用同一个SQL ID，避免重复查询数据
 * // 进度环的fields配置：第一个字段计算分子，第二个字段计算分母（百分比）
 * // filter配置：支持按字段值过滤数据后再计算
 * //   - operator: eq(等于), ne(不等于), gt(大于), lt(小于), gte(大于等于), lte(小于等于), in(包含), contains(包含字符串)
 */
<template>
  <div class="expense-alert">
    <!-- 文本描述区域 -->
    <div class="text-section">
      <div v-for="(item, index) in textList" :key="index" class="text-item">
        <div class="text-label">{{ item.label }}</div>
        <div class="text-content">{{ getTextContent(item) }}</div>
      </div>
    </div>
    
    <!-- 告警和进度环组合区域 -->
    <div class="alert-progress-section">
      <div v-for="(item, index) in alertProgressList" :key="index" class="alert-progress-item">
        <div class="alert-info">
          <div class="alert-value">{{ item.alert?.label }}</div>
          <div class="alert-value">{{ getAlertContent(item.alert) }}</div>
        </div>
        <div class="progress-ring-container">
          <ProgressRing
            v-if="item.progress"
            :sql-id="item.progress.sqlId"
            :fields="item.progress.fields"
            :label="item.progress.label"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import ProgressRing from './ProgressRing.vue';
import api from '@/api/index';

const props = defineProps({
  info: {
    type: Object,
    default: () => ({})
  }
});

// 从 CHART_CONFIG 获取配置
const chartConfig = computed(() => {
  try {
    return props.info?.CHART_CONFIG ? JSON.parse(props.info.CHART_CONFIG) : {};
  } catch (e) {
    console.error('Failed to parse CHART_CONFIG:', e);
    return {};
  }
});

const title = computed(() => chartConfig.value.title || '出院患者费用预警');
const textList = computed(() => chartConfig.value.textList || []);
const alertProgressList = computed(() => chartConfig.value.alertProgressList || []);

// 文本数据缓存
const textDataCache = ref({});

// 计算字段值
const calculateField = (data, fieldConfig) => {
  const { name, func } = fieldConfig;
  const values = data.map(item => parseFloat(item[name]) || 0).filter(v => !isNaN(v));
  
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
      return (values.reduce((a, b) => a + b, 0) / values.length).toFixed(2);
    case 'COUNT':
      return values.length;
    default:
      return values[0];
  }
};

// 获取文本内容
const getTextContent = (item) => {
  const data = textDataCache.value[item.sqlId];
  if (!data || !item.format) return '';
  
  let result = item.format;
  
  // 处理字段配置
  if (item.fields) {
    item.fields.forEach(field => {
      const value = calculateField(data, field);
      result = result.replace(new RegExp(`\\{${field.name}\\}`, 'g'), value);
    });
  }
  
  return result;
};

// 获取告警内容
const getAlertContent = (alertItem) => {
  if (!alertItem) return '';
  
  // 如果有 sqlId，从缓存中获取数据并格式化
  if (alertItem.sqlId && alertItem.format) {
    const data = textDataCache.value[alertItem.sqlId];
    if (!data) return '';
    
    let result = alertItem.format;
    
    // 处理字段配置
    if (alertItem.fields) {
      alertItem.fields.forEach(field => {
        const value = calculateField(data, field);
        result = result.replace(new RegExp(`\\{${field.name}\\}`, 'g'), value);
      });
    }
    
    return result;
  }
  
  // 兼容旧的 value 配置
  return alertItem.value || '';
};

// 获取文本数据
const fetchTextData = async () => {
  // 收集所有需要查询的 SQL ID，避免重复查询
  const sqlIdsToFetch = new Set();
  
  // 收集文本列表的 SQL ID
  textList.value.forEach(item => {
    if (item.sqlId) sqlIdsToFetch.add(item.sqlId);
  });
  
  // 收集告警和进度环的 SQL ID
  alertProgressList.value.forEach(item => {
    if (item.alert?.sqlId) sqlIdsToFetch.add(item.alert.sqlId);
    if (item.progress?.sqlId) sqlIdsToFetch.add(item.progress.sqlId);
  });
  
  // 批量查询数据
  for (const sqlId of sqlIdsToFetch) {
    // 只在缓存中没有数据时才查询
    if (!textDataCache.value[sqlId]) {
      try {
        const response = await api.executeData(sqlId, {});
        if (response && Array.isArray(response) && response.length > 0) {
          const data = JSON.parse(response[0].DATA || '[]');
          textDataCache.value[sqlId] = data;
        }
      } catch (error) {
        console.error(`Failed to fetch data for ${sqlId}:`, error);
      }
    }
  }
};

onMounted(() => {
  fetchTextData();
});
</script>

<style lang="scss" scoped>
.expense-alert {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 16px;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e8f0 100%);
  border-radius: 8px;
  color: #333;

  .text-section {
    display: flex;
    flex-direction: column;
    flex-wrap: wrap;
    gap: 16px;
    margin-bottom: 20px;
    flex-shrink: 0;

    .text-item {
      display: flex;
      align-items: center;
      flex: 1;
      min-width: 200px;

      .text-label {
        min-width: 60px;
        padding: 4px 12px;
        background: #2196f3;
        border-radius: 4px;
        font-size: 12px;
        font-weight: 500;
        color: #fff;
        margin-right: 12px;
        flex-shrink: 0;
      }

      .text-content {
        flex: 1;
        font-size: 14px;
        color: #333;
        line-height: 1.6;
      }
    }
  }

  .alert-progress-section {
    flex: 1;
    display: flex;
    justify-content: center;
    align-items: stretch;
    gap: 40px;
    padding: 16px;
    background: rgba(255, 255, 255, 0.8);
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    min-height: 200px;

    .alert-progress-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 12px;
        flex: 1;
        height: 100%;

        .alert-info {
          display: flex;
          flex-direction: row;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;

          .alert-label {
            font-size: 14px;
            color: #666;
          }

          .alert-value {
            font-size: 20px;
            font-weight: 600;
            color: #333;
          }
        }

        .progress-ring-container {
          width: 100%;
          flex: 1;
          min-height: 120px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
      }
  }
}
</style>
