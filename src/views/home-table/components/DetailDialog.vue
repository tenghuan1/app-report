/**
* 详细数据对话框组件
* @component
* @description 用于展示下钻后的详细数据
* @props {boolean} visible - 是否显示对话框
* @props {string} sqlId - 详细数据查询SQL ID
* @props {Object} params - 查询参数
* @example <DetailDialog :visible="true" :sqlId="'detail_sql'" :params="{id: 1}" @close="handleClose" />
*/
<template>
  <el-dialog
    v-model="dialogVisible"
    title="详细数据"
    width="80%"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <el-table
      :data="detailData"
      height="500"
      border
      stripe
      v-loading="loading"
      empty-text="暂无数据"
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
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import api from '@/api/index';

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  sqlId: {
    type: String,
    default: ''
  },
  params: {
    type: Object,
    default: () => ({})
  }
});

const emit = defineEmits(['close']);

const detailData = ref([]);
const loading = ref(false);

const dialogVisible = computed({
  get: () => props.visible,
  set: (value) => {
    if (!value) {
      handleClose();
    }
  }
});

const columns = computed(() => {
  console.log('DetailDialog columns - detailData:', detailData.value);
  if (!detailData.value || detailData.value.length === 0) return [];
  
  const keys = Object.keys(detailData.value[0]);
  console.log('DetailDialog columns - keys:', keys);
  return keys.map(key => ({
    prop: key,
    label: key,
    minWidth: 100
  }));
});

const fetchDetailData = async () => {
  debugger
  if (!props.sqlId) return;
  
  loading.value = true;
  try {
    const response = await api.executeData(props.sqlId, props.params);
    console.log('DetailDialog data:', response);
    
    if (response && Array.isArray(response) && response.length > 0) {
      detailData.value = JSON.parse(response[0].DATA || '[]');
      console.log('DetailDialog data:', detailData.value);
    }
  } catch (error) {
    console.error('Failed to fetch DetailDialog data:', error);
  } finally {
    loading.value = false;
  }
};

const handleClose = () => {
  emit('close');
  detailData.value = [];
};

watch(() => props.visible, (newVal) => {
  console.log('DetailDialog visible changed:', newVal);
  if (newVal) {
    fetchDetailData();
  }
}, { immediate: true });

onMounted(() => {
  console.log('DetailDialog mounted, visible:', props.visible);
  if (props.visible) {
    fetchDetailData();
  }
});
</script>

<style lang="scss" scoped>
:deep(.el-dialog__body) {
  padding: 20px;
}
</style>
