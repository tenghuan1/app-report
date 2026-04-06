/**
* 多表格组件
* @component
* @description 用于展示多个表格，支持横向、纵向、网格布局。子组件自己查询数据。
* @props {Object} info - 组件配置信息
* @props {string} info.CHART_CONFIG - JSON格式的配置字符串，包含相关配置
* @props {string} info.CHART_CONFIG.title - 组件标题，默认为'多表格展示'
* @props {string} info.CHART_CONFIG.layout - 布局类型：'vertical'（纵向）、'horizontal'（横向）、'grid'（网格）
* @props {number} info.CHART_CONFIG.gridColumns - 网格布局的列数，默认为2
* @props {Array} info.CHART_CONFIG.tables - 表格配置数组
* @props {string} info.CHART_CONFIG.tables[].label - 表格标题（可选，为空则不显示header）
* @props {string} info.CHART_CONFIG.tables[].sqlId - 表格数据查询SQL ID
* @example
* <DoubleScrollTable :info="item" />
* // CHART_CONFIG示例 - 纵向布局（2个表格）
* // {
* //   "title": "住院床位占床情况",
* //   "layout": "vertical",
* //   "tables": [
* //     {
* //       "label": "全院加床数",
* //       "sqlId": "bed_overflow"
* //     },
* //     {
* //       "label": "全院空床数",
* //       "sqlId": "bed_empty"
* //     }
* //   ]
* // }
* // CHART_CONFIG示例 - 横向布局（2个表格）
* // {
* //   "title": "住院床位占床情况",
* //   "layout": "horizontal",
* //   "tables": [
* //     {
* //       "label": "全院加床数",
* //       "sqlId": "bed_overflow"
* //     },
* //     {
* //       "label": "全院空床数",
* //       "sqlId": "bed_empty"
* //     }
* //   ]
* // }
* // CHART_CONFIG示例 - 网格布局（4个表格，2x2）
* // {
* //   "title": "多维度数据分析",
* //   "layout": "grid",
* //   "gridColumns": 2,
* //   "tables": [
* //     {
* //       "label": "全院加床数",
* //       "sqlId": "bed_overflow"
* //     },
* //     {
* //       "label": "全院空床数",
* //       "sqlId": "bed_empty"
* //     },
* //     {
* //       "label": "全院加床数2",
* //       "sqlId": "bed_overflow2"
* //     },
* //     {
* //       "label": "全院空床数2",
* //       "sqlId": "bed_empty2"
* //     }
* //   ]
* // }
*/
<template>
  <div class="multi-table" :class="`layout-${layoutType}`" :style="{ '--grid-columns': gridColumns }">
    <div v-for="(table, index) in tables" :key="index" class="table-section">
      <div class="table-header" v-if="table.label">
        <div class="table-label">{{ table.label }}</div>
      </div>
      
      <div class="table-container">
        <ScrollTable :info="{ SQL_ID: table.sqlId }" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import ScrollTable from './ScrollTable.vue';

const props = defineProps({
  info: {
    type: Object,
    default: () => ({})
  }
});

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
const title = computed(() => chartConfig.value.title || '多表格展示');
const layoutType = computed(() => chartConfig.value.layout || 'vertical');
const gridColumns = computed(() => chartConfig.value.gridColumns || 2);
const tables = computed(() => {
  const defaultTables = [
    {
      label: '全院加床数',
      sqlId: ''
    },
    {
      label: '全院空床数',
      sqlId: ''
    }
  ];
  return chartConfig.value.tables || defaultTables;
});

onMounted(() => {
  // 子组件 ScrollTable 自己处理数据查询和刷新
  // 父组件只需负责布局和配置传递
});
</script>

<style lang="scss" scoped>
.multi-table {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  padding: 12px;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border: 1px solid #e8f4ff;

  // 纵向布局（默认）
  &.layout-vertical {
    .table-section {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-height: 0;
      margin-bottom: 12px;

      &:last-child {
        margin-bottom: 0;
      }
    }
  }

  // 横向布局
  &.layout-horizontal {
    flex-direction: row;
    flex-wrap: nowrap;
    overflow-x: auto;

    .table-section {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-height: 0;
      min-width: 0;
      margin-right: 12px;

      &:last-child {
        margin-right: 0;
      }
    }
  }

  // 网格布局（2x2）
  &.layout-grid {
    display: grid;
    grid-template-columns: repeat(var(--grid-columns, 2), 1fr);
    grid-auto-rows: 1fr;
    gap: 12px;

    .table-section {
      display: flex;
      flex-direction: column;
      min-height: 0;
    }
  }

  .table-section {
    .table-header {
      flex-shrink: 0;
      display: flex;
      justify-content: center;
      align-items: center;
      margin-bottom: 8px;
      padding: 8px 12px;
      background: linear-gradient(135deg, #E3F2FD, #BBDEFB);
      color: #1976D2;
      border-radius: 8px;

      .table-label {
        font-size: 14px;
        font-weight: 500;
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
