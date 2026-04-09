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
*
<MultiViewComponent :info="item" />
* // CHART_CONFIG示例
* // {
* // "tabs": [
* // {
* // "type": "table",
* // "sqlId": "main_data",
* // "title": "数据表格",
* // "drillDown": {
* // "sqlId": "detail_data",
* // "params": {
* // "id": "id",
* // "name": "name"
* // }
* // }
* // },
* // {
* // "type": "pie",
* // "sqlId": "pie_data",
* // "title": "饼状图",
* // "pieChartCategory": "category",
* // "pieChartValue": "value"
* // },
* // {
* // "type": "bar",
* // "sqlId": "bar_data",
* // "title": "柱状图",
* // "BAR_CHART_X": "month",
* // "BAR_CHART_Y": "sales|profit"
* // }
* // ]
* // }
*/
<template>
  <div class="multi-view-component">
    <div class="content-section">
      <!-- 过滤器区域 -->
      <div class="filter-section" v-if="showFilterSection">
        <el-form :inline="true" :model="filterForm" class="filter-form">
          <!-- 日期区间选择器 -->
          <el-form-item v-if="isShowDateRange" label="时间区间">
            <el-date-picker
              v-model="dateRange"
              type="daterange"
              :format="dateFormat"
              :value-format="dateFormat"
              range-separator="至"
              start-placeholder="开始时间"
              end-placeholder="结束时间"
              :key="`daterange-filter`"
            />
          </el-form-item>
          <!-- 文本输入框 -->
          <el-form-item v-for="(filter, index) in textFilters" :key="`text-${index}`" :label="filter.label">
            <el-input v-model="filterForm[filter.prop]" :placeholder="filter.placeholder" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleQuery">查询</el-button>
          </el-form-item>
        </el-form>
      </div>

      <!-- 前台检索区域 -->
      <div class="frontend-filter-section" v-if="frontendFilterConfig.length > 0">
        <el-form :inline="true" :model="frontendFilterForm" class="filter-form">
          <el-form-item v-for="(filter, index) in frontendFilterConfig" :key="index" :label="filter.label">
            <!-- 输入框 -->
            <el-input v-if="filter.type === 'input'" v-model="frontendFilterForm[filter.props]"
              :placeholder="`请输入${filter.label}`" clearable @change="handleFrontendFilterChange"
              :key="`frontend-input-${filter.props}`" />
            <!-- 日期选择框 -->
            <el-date-picker v-else-if="filter.type === 'date'" v-model="frontendFilterForm[filter.props]" type="date"
              value-format="YYYY-MM-DD" :placeholder="`选择${filter.label}`" clearable @change="handleFrontendFilterChange"
              :key="`frontend-date-${filter.props}`" />
            <!-- 日期区间选择框 -->
            <el-date-picker v-else-if="filter.type === 'dateRange'" v-model="frontendFilterForm[filter.props]"
              type="daterange" value-format="YYYY-MM-DD" range-separator="至" start-placeholder="开始日期"
              end-placeholder="结束日期" clearable @change="handleFrontendFilterChange"
              :key="`frontend-daterange-${filter.props}`" />
          </el-form-item>
          <el-form-item>
            <el-button @click="handleFrontendReset">重置</el-button>
          </el-form-item>
        </el-form>
      </div>

      <el-tabs v-model="activeTab" type="card" @tab-change="handleTabChange">
        <el-tab-pane v-for="(tab, index) in tabsConfig" :key="index" :label="tab.title" :name="String(index)">
          <div class="tab-content">
            <TableView v-if="tab.type === 'table'" :info="tab" :data="chartData" :key="`table-${index}`"
              @row-dblclick="handleRowDblClick" />
            <PieChart v-else-if="tab.type === 'pie'" :info="tab" :data="chartData" :key="`pie-${index}`" />
            <BarChart v-else-if="tab.type === 'bar'" :info="tab" :data="chartData" :key="`bar-${index}`" />
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>

    <DetailDialog v-if="showDetailDialog" :visible="showDetailDialog" :sqlId="detailConfig.sqlId"
      :params="{ ...detailParams, ...filterForm }" @close="showDetailDialog = false" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import TableView from './TableView.vue';
import PieChart from './PieChart.vue';
import BarChart from './BarChart.vue';
import DetailDialog from './DetailDialog.vue';
import api from '@/api/index';

const props = defineProps({
  info: {
    type: Object,
    default: () => ({})
  }
});

const activeTab = ref('0');
const showDetailDialog = ref(false);
const detailConfig = ref({
  sqlId: ''
});
const detailParams = ref({});
const filterForm = ref({});
const chartData = ref([]);
const loading = ref(false);
const frontendFilterForm = ref({});
const dateRange = ref([]); // 日期区间 [开始时间, 结束时间]

// 是否显示日期区间选择器
const isShowDateRange = computed(() => {
  return props.info?.IS_SHOW_DATE_RANGE === '1' || props.info?.IS_SHOW_DATE_RANGE === 1;
});

// 日期格式，默认 yyyy-MM-dd
const dateFormat = computed(() => {
  return props.info?.FORMAT || 'YYYY-MM-DD';
});

// 是否显示过滤区域
const showFilterSection = computed(() => {
  return isShowDateRange.value || textFilters.value.length > 0;
});

// 文本过滤器配置
const textFilters = computed(() => {
  const filterText = props.info?.FILTER_TEXT;
  if (!filterText) return [];
  
  // 使用 | 分割配置
  const texts = filterText.split('|').map(t => t.trim()).filter(t => t);
  return texts.map((text, index) => ({
    label: text,
    prop: text,
    placeholder: text
  }));
});

// 计算日期函数
const calculateDate = (days) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
};

// 格式化日期函数
const formatDate = (date, format) => {
  if (!date) return '';
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return format
    .replace('YYYY', year)
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds);
};

// 初始化日期区间
const initDateRange = () => {
  if (!isShowDateRange.value) return;
  
  const rangeDefault = props.info?.RANGE_DEFAULT;
  if (!rangeDefault) {
    // 不维护默认当天
    const today = new Date();
    dateRange.value = [
      formatDate(today, dateFormat.value),
      formatDate(today, dateFormat.value)
    ];
    return;
  }
  
  // 解析默认值配置
  const ranges = rangeDefault.split('|').map(r => r.trim());
  if (ranges.length === 2) {
    const startDays = parseInt(ranges[0]) || 0;
    const endDays = parseInt(ranges[1]) || 0;
    
    const startDate = calculateDate(startDays);
    const endDate = calculateDate(endDays);
    
    dateRange.value = [
      formatDate(startDate, dateFormat.value),
      formatDate(endDate, dateFormat.value)
    ];
  }
};

// 直接从props.info获取配置
const chartConfig = computed(() => {
  try {
    return props.info?.CHART_CONFIG ? JSON.parse(props.info.CHART_CONFIG) : {};
  } catch (e) {
    console.error('Failed to parse CHART_CONFIG:', e);
    return {};
  }
});

const filterConfig = computed(() => {
  try {
    return props.info?.FILTER_SQL ? JSON.parse(props.info.FILTER_SQL) : [];
  } catch (e) {
    console.error('Failed to parse FILTER_SQL:', e);
    return [];
  }
});

const tabsConfig = computed(() => {
  return chartConfig.value.tabs || [];
});

// 当前选中的tab配置
const currentTabConfig = computed(() => {
  const tabIndex = parseInt(activeTab.value);
  return tabsConfig.value[tabIndex] || {};
});

// 前台过滤配置（全局配置，所有tab共享）
const frontendFilterConfig = computed(() => {
  try {
    if (props.info?.FILTER_COLUMN) {
      return JSON.parse(props.info.FILTER_COLUMN);
    }
    return [];
  } catch (e) {
    console.error('Failed to parse FILTER_COLUMN:', e);
    return [];
  }
});

// 计算日期默认值
const calculateDateDefault = (defaultValue, format) => {
  const date = new Date();
  if (defaultValue) {
    const days = parseInt(defaultValue);
    date.setDate(date.getDate() + days);
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return format
    .replace('YYYY', year)
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds);
};

// 初始化过滤器表单
const initFilterForm = () => {
  const form = {};
  filterConfig.value.forEach(filter => {
    if (filter.type === 'date' && filter.default) {
      form[filter.props] = calculateDateDefault(filter.default, filter.format);
    } else if (filter.type === 'input' && filter.default) {
      form[filter.props] = filter.default;
    } else {
      form[filter.props] = '';
    }
  });
  filterForm.value = form;
};

// 初始化前台过滤器表单（只在组件初始化和重置时调用）
const initFrontendFilterForm = () => {
  const form = {};
  frontendFilterConfig.value.forEach(filter => {
    if (filter.type === 'dateRange') {
      form[filter.props] = [];
    } else {
      form[filter.props] = '';
    }
  });
  frontendFilterForm.value = form;
};

const handleTabChange = (tabName) => {
  console.log('Tab changed to:', tabName);
  // 切换tab时保持过滤状态，不重新查询数据
  // 确保当前tab也使用过滤后的数据
  applyFrontendFilter();
};

// 原始数据（未经过前台过滤）
const rawData = ref([]);
debugger
// 查询数据
const fetchData = async () => {
  const sqlId = props.info?.SQL_ID;
  if (!sqlId) return;

  loading.value = true;
  try {
    // 构建查询参数
    const params = { ...filterForm.value };
    
    // 添加日期区间参数
    if (isShowDateRange.value && dateRange.value && dateRange.value.length === 2) {
      params.startDate = dateRange.value[0];
      params.endDate = dateRange.value[1];
    }
    
    console.log('Query params:', params);
    const response = await api.executeData(sqlId, params);
    console.log('MultiViewComponent data:', response);

    if (response && Array.isArray(response) && response.length > 0) {
      rawData.value = response[0].DATA ? JSON.parse(response[0].DATA || '[]') : response;
      console.log('Raw data:', rawData.value);
      // 应用前台过滤
      applyFrontendFilter();
    } else {
      rawData.value = [];
      chartData.value = [];
    }
  } catch (error) {
    console.error('Failed to fetch data:', error);
    rawData.value = [];
    chartData.value = [];
  } finally {
    loading.value = false;
  }
};

// 应用前台过滤
const applyFrontendFilter = () => {
  let result = [...rawData.value];

  frontendFilterConfig.value.forEach(filter => {
    const filterValue = frontendFilterForm.value[filter.props];
    if (!filterValue || (Array.isArray(filterValue) && filterValue.length === 0)) {
      return;
    }

    // 获取要过滤的字段列表
    const fields = filter.props.split('|').map(f => f.trim());

    result = result.filter(row => {
      // input 类型：模糊匹配任一字段
      if (filter.type === 'input') {
        return fields.some(field => {
          const cellValue = String(row[field] || '').toLowerCase();
          return cellValue.includes(String(filterValue).toLowerCase());
        });
      }

      // date 类型：精确匹配任一字段
      if (filter.type === 'date') {
        return fields.some(field => {
          const cellValue = String(row[field] || '').split(' ')[0];
          return cellValue === filterValue;
        });
      }

      // dateRange 类型：区间匹配任一字段
      if (filter.type === 'dateRange' && Array.isArray(filterValue) && filterValue.length === 2) {
        const [startDate, endDate] = filterValue;
        return fields.some(field => {
          const cellValue = String(row[field] || '').split(' ')[0];
          return cellValue >= startDate && cellValue <= endDate;
        });
      }

      return true;
    });
  });

  // 确保总是创建新数组，触发响应式更新
  // 这样所有使用 chartData 的组件（表格、饼状图、柱状图）都会更新
  chartData.value = [...result];
  console.log('Applied frontend filter, chartData:', chartData.value);
};

const handleQuery = () => {
  console.log('Filter form:', filterForm.value);
  // 重新查询数据
  fetchData();
};

// 防抖定时器
const debounceTimer = ref(null);

// 处理前台过滤变化（带防抖）
const handleFrontendFilterChange = () => {
  console.log('Frontend filter form:', frontendFilterForm.value);
  
  // 清除之前的定时器
  if (debounceTimer.value) {
    clearTimeout(debounceTimer.value);
  }
  
  // 设置新的定时器，300ms 防抖
  debounceTimer.value = setTimeout(() => {
    // 应用前台过滤，不重新查询数据库
    applyFrontendFilter();
  }, 300);
};

// 重置前台过滤
const handleFrontendReset = () => {
  initFrontendFilterForm();
  // 应用前台过滤，显示所有数据
  applyFrontendFilter();
};

const handleRowDblClick = (row, tabConfig) => {
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

// 监听 props.info 变化，自动查询数据
watch(
  () => props.info,
  (newInfo) => {
    if (newInfo?.SQL_ID) {
      console.log('Info changed, fetching data:', newInfo);
      // 重新初始化过滤器表单，确保默认值正确显示
      initFilterForm();
      initFrontendFilterForm();
      // 重新查询数据
      fetchData();
    }
  },
  { immediate: true, deep: true }
);

// 切换最大化状态
onMounted(() => {
  initFilterForm();
  initFrontendFilterForm();
  initDateRange();
});
</script>

<style lang="scss" scoped>
.multi-view-component {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    position: relative;
    transition: all 0.3s ease;
}

/* 内容区域 */
.content-section {
    flex: 1;
    overflow: hidden;
    padding: 8px;

    .filter-section {
      padding: 6px 10px;
      background-color: #f8f9fa;
      border-bottom: 1px solid #e9ecef;
      margin-bottom: 4px;

      .filter-form {
        display: flex;
        flex-wrap: wrap;
        align-items: center;

        :deep(.el-form-item) {
          margin-bottom: 6px;
          margin-right: 10px;
          margin-top: 0;

          :deep(.el-form-item__label) {
            padding-right: 8px;
          }

          :deep(.el-input),
          :deep(.el-date-picker) {
            width: 160px;
          }
        }
      }
    }

    .frontend-filter-section {
      padding: 6px 10px;
      background-color: #f0f9ff;
      border-bottom: 1px solid #d9ecff;
      margin-bottom: 4px;

      .filter-form {
        display: flex;
        flex-wrap: wrap;
        align-items: center;

        :deep(.el-form-item) {
          margin-bottom: 6px;
          margin-right: 10px;
          margin-top: 0;

          :deep(.el-form-item__label) {
            padding-right: 8px;
          }

          :deep(.el-input),
          :deep(.el-date-picker) {
            width: 160px;
          }
        }
      }
    }

    :deep(.el-tabs) {
      display: flex;
      flex-direction: column;
      flex: 1;
      min-height: 0;
      height: 100%;

      .el-tabs__header {
        margin: 0 0 4px 0;
        padding-bottom: 4px;
        flex-shrink: 0;
      }

      .el-tabs__content {
        flex: 1;
        overflow: hidden;
        height: calc(100% - 40px);
      }

      .el-tab-pane {
        height: 100%;
        overflow: hidden;
      }
    }

    .tab-content {
      width: 100%;
      height: 100%;
      min-height: 200px;
      max-height: 100%;
      overflow: hidden;
      padding-bottom: 8px;
      box-sizing: border-box;
    }
  }
</style>
