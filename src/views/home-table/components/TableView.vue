/**
* 表格视图组件
* @component
* @description 用于展示表格数据，支持双击行下钻查看详细数据
* @props {Object} info - 组件配置信息
* @props {string} info.sqlId - SQL查询ID
* @props {string} info.CHART_CONFIG - JSON格式的配置字符串（可选）
* @props {Object} info.drillDown - 下钻配置
* @props {string} info.drillDown.sqlId - 详细数据查询SQL ID
* @props {Object} info.drillDown.params - 主数据传递给详细数据的字段映射
* @props {Array} data - 表格数据数组（由父组件传递）
* @example <TableView :info="tab" :data="tableData" @row-dblclick="handleRowDblClick" />
*/
<template>
  <div class="table-view">
    <el-table
      :data="displayData"
      height="100%"
      border
      stripe
      @row-dblclick="handleRowDblClick"
    >
      <el-table-column
        v-for="column in columns"
        :key="column.prop"
        :prop="column.prop"
        :label="column.label"
        :width="column.width"
        :min-width="column.minWidth"
      />
    </el-table>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';

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

const emit = defineEmits(['row-dblclick']);

const columns = computed(() => {
  if (!props.data || props.data.length === 0) return [];

  const keys = Object.keys(props.data[0]);
  return keys.map(key => ({
    prop: key,
    label: key,
    minWidth: 100
  }));
});

// 显示的数据
const displayData = computed(() => {
  return props.data || [];
});

const handleRowDblClick = (row) => {
  emit('row-dblclick', row, props.info);
};
</script>

<style lang="scss" scoped>
.table-view {
  width: 100%;
  height: 100%;
  padding-bottom: 8px;
  box-sizing: border-box;

  :deep(.el-table) {
    height: 100%;

    .el-table__body-wrapper {
      overflow-y: auto;
    }
  }
}
</style>
