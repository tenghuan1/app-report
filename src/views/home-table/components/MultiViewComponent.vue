/**
* 多视图数据展示组件
* @component
* @description 用于展示表格、饼状图、柱状图等多种数据视图，支持tab切换和下钻功能
* @props {Object} info - 组件配置信息
* @props {string} info.SQL_ID - SQL查询ID（已弃用，使用tabs中的sqlId）
* @props {string} info.CHART_CONFIG - JSON格式的配置字符串，包含tabs等字段
* @props {Array} info.CHART_CONFIG.tabs - tab配置数组
* @props {string} info.CHART_CONFIG.tabs[].type - 视图类型：'table'（表格）、'pie'（饼状图）、'bar'（柱状图）
* @props {string} info.CHART_CONFIG.tabs[].sqlId - 数据查询SQL ID
* @props {string} info.CHART_CONFIG.tabs[].title - tab标题
* @props {Object} info.CHART_CONFIG.tabs[].drillDown - 下钻配置（仅table类型）
* @props {string} info.CHART_CONFIG.tabs[].drillDown.sqlId - 详细数据查询SQL ID
* @props {Object} info.CHART_CONFIG.tabs[].drillDown.params - 主数据传递给详细数据的字段映射，格式：{ "主数据字段": "详细数据参数名" }
* @props {string} info.CHART_CONFIG.tabs[].pieChartCategory - 分类字段名（仅pie类型）
* @props {string} info.CHART_CONFIG.tabs[].pieChartValue - 值字段名（仅pie类型）
* @props {string} info.CHART_CONFIG.tabs[].BAR_CHART_X - X轴字段名（仅bar类型）
* @props {string} info.CHART_CONFIG.tabs[].BAR_CHART_Y - Y轴字段名，多个字段用"|"分隔（仅bar类型）
* @example
* <MultiViewComponent :info="item" />
* // CHART_CONFIG示例
* // {
* //   "tabs": [
* //     {
* //       "type": "table",
* //       "sqlId": "main_data",
* //       "title": "数据表格",
* //       "drillDown": {
* //         "sqlId": "detail_data",
* //         "params": {
* //           "id": "id",
* //           "name": "name"
* //         }
* //       }
* //     },
* //     {
* //       "type": "pie",
* //       "sqlId": "pie_data",
* //       "title": "饼状图",
* //       "pieChartCategory": "category",
* //       "pieChartValue": "value"
* //     },
* //     {
* //       "type": "bar",
* //       "sqlId": "bar_data",
* //       "title": "柱状图",
* //       "BAR_CHART_X": "month",
* //       "BAR_CHART_Y": "sales|profit"
* //     }
* //   ]
* // }
*/
<template>
  <div class="multi-view-component">
    <el-tabs v-model="activeTab" type="card" @tab-change="handleTabChange">
      <el-tab-pane
        v-for="(tab, index) in tabsConfig"
        :key="index"
        :label="tab.title"
        :name="String(index)"
      >
        <div class="tab-content">
          <TableView
            v-if="tab.type === 'table'"
            :info="tab"
            @row-dblclick="handleRowDblClick"
          />
          <PieChart
            v-else-if="tab.type === 'pie'"
            :info="tab"
          />
          <BarChart
            v-else-if="tab.type === 'bar'"
            :info="tab"
          />
        </div>
      </el-tab-pane>
    </el-tabs>

    <DetailDialog
      v-if="showDetailDialog"
      :visible="showDetailDialog"
      :sqlId="detailConfig.sqlId"
      :params="detailParams"
      @close="showDetailDialog = false"
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import TableView from './TableView.vue';
import PieChart from '../../home-card/components/PieChart.vue';
import BarChart from '../../home-card/components/BarChart.vue';
import DetailDialog from './DetailDialog.vue';
import { useMenuStore } from '../../../stores/menu';

const props = defineProps({
  info: {
    type: Object,
    default: () => ({})
  }
});

const menuStore = useMenuStore();

const activeTab = ref('0');
const showDetailDialog = ref(false);
const detailConfig = ref({
  sqlId: ''
});
const detailParams = ref({});

const chartConfig = computed(() => {
  try {
    // 优先使用从menuStore获取的当前菜单配置
    const currentMenu = menuStore.currentMenu;
    if (currentMenu?.CHART_CONFIG) {
      return JSON.parse(currentMenu.CHART_CONFIG);
    }
    // 其次使用props传入的配置
    return props.info?.CHART_CONFIG ? JSON.parse(props.info.CHART_CONFIG) : {};
  } catch (e) {
    console.error('Failed to parse CHART_CONFIG:', e);
    return {};
  }
});

const tabsConfig = computed(() => {
  return chartConfig.value.tabs || [];
});

const handleTabChange = (tabName) => {
  console.log('Tab changed to:', tabName);
};

const handleRowDblClick = (row, tabConfig) => {
  debugger
  console.log('Row dblclick:', row, tabConfig);
  if (!tabConfig.drillDown || !tabConfig.drillDown.sqlId) {
    return;
  }

  const params = {};
  const paramsMapping = tabConfig.drillDown.params || {};
  
  Object.keys(paramsMapping).forEach(mainField => {
    const detailParamName = paramsMapping[mainField];
    params[detailParamName] = row[mainField];
  });

  detailConfig.value = {
    sqlId: tabConfig.drillDown.sqlId
  };
  detailParams.value = params;
  showDetailDialog.value = true;
};
</script>

<style lang="scss" scoped>
.multi-view-component {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;

  :deep(.el-tabs) {
    display: flex;
    flex-direction: column;
    height: 100%;

    .el-tabs__header {
      margin: 0;
    }

    .el-tabs__content {
      flex: 1;
      overflow: hidden;
    }

    .el-tab-pane {
      height: 100%;
    }
  }

  .tab-content {
    width: 100%;
    height: 100%;
    overflow: hidden;
  }
}
</style>
