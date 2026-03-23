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
* @example <TableView :info="tab" @row-dblclick="handleRowDblClick" />
*/
<template>
  <div class="table-view">
    <el-table
      :data="tableData"
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
import { ref, computed, onMounted, onUnmounted } from 'vue';
import api from '@/api/index';

const props = defineProps({
  info: {
    type: Object,
    default: () => ({})
  }
});

const emit = defineEmits(['row-dblclick']);

const tableData = ref([]);
const refreshInterval = ref(null);
const refreshEnabled = ref(true);
const intervalTime = ref(5);

const columns = computed(() => {
  
  if (!tableData.value || tableData.value.length === 0) return [];
  
  const keys = Object.keys(tableData.value[0]);
  return keys.map(key => ({
    prop: key,
    label: key,
    minWidth: 100
  }));
});

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

const setupAutoRefresh = () => {
  if (refreshInterval.value) {
    clearInterval(refreshInterval.value);
  }
  
  if (refreshEnabled.value) {
    refreshInterval.value = setInterval(() => {
      fetchData();
    }, intervalTime.value * 1000);
  }
};

const handleRefreshSettingsChange = () => {
  loadRefreshSettings();
  setupAutoRefresh();
};

const fetchData = async () => {
  const sqlId = props.info?.sqlId;
  if (!sqlId) return;
  
  try {
    const response = await api.executeData(sqlId, {});
    console.log('TableView data:', response);
    
    if (response && Array.isArray(response) && response.length > 0) {
      tableData.value = JSON.parse(response[0].DATA || '[]');
      console.log('TableView data:', tableData.value);
    }
  } catch (error) {
    console.error('Failed to fetch TableView data:', error);
  }
};

const handleRowDblClick = (row) => {
  emit('row-dblclick', row, props.info);
};

onMounted(() => {
  loadRefreshSettings();
  setupAutoRefresh();
  window.addEventListener('refresh-settings-updated', handleRefreshSettingsChange);
  if (props.info?.sqlId) {
    fetchData();
  }
});

onUnmounted(() => {
  window.removeEventListener('refresh-settings-updated', handleRefreshSettingsChange);
  
  if (refreshInterval.value) {
    clearInterval(refreshInterval.value);
  }
});
</script>

<style lang="scss" scoped>
.table-view {
  width: 100%;
  height: 100%;

  :deep(.el-table) {
    height: 100%;
    
    .el-table__body-wrapper {
      overflow-y: auto;
    }
  }
}
</style>
