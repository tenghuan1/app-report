/**
 * 医院经营数据看板组件
 * @component
 * @description 用于展示医院经营数据的综合看板，包含多种数据可视化组件
 * @props {string} dataId - 数据ID（可选）
 * @props {Object} info - 配置信息（可选）
 * @props {string} info.SQL_ID - SQL查询ID，用于获取数据
 * @example <Home :info="menuItem.info" />
 */
<template>
  <div class="page" :class="{ 'fullscreen': isFullscreen }">
    <div class="dashboard-container">
      <!-- 顶部标题 -->
      <div class="header">
        <div class="header-decoration-left">
          <div class="decoration-line"></div>
        </div>
        <div class="title">
          <span>医院经营数据看板</span>
        </div>
        <div class="header-right">
          <div class="header-decoration-right">
            <div class="decoration-line"></div>
          </div>
        </div>
      </div>

      <!-- 全屏按钮和时间显示 -->
      <div class="header-controls">
        <div class="current-time">{{ currentTime }}</div>
        <div class="fullscreen-btn" @click="toggleFullscreen">
          <el-icon v-if="!isFullscreen"><FullScreen /></el-icon>
          <el-icon v-else><Crop /></el-icon>
        </div>
      </div>

      <!-- 主内容区域 -->
      <div class="main-content">
        <div class="content-border">
          <div class="grid-container" v-if="homeData && homeData.length > 0">
            <div 
              v-for="item in sortedHomeData" 
              :key="item.ID"
              :class="['grid-item', `row-${item.row}`, `col-${item.col}`]"
              :style="{
                gridRow: `span ${item.rowSpan}`,
                gridColumn: `span ${item.colSpan}`
              }"
            >
              <FrameBox :title="item.NAME">
                <!-- 数字翻牌器 -->
                <DigitalCard 
                  v-if="item.CHART_TYPE === 'DigitalCard'"
                  :info="item"
                />
                <!-- 折线图 -->
                <LineChart 
                  v-else-if="item.CHART_TYPE === 'LineChart'"
                  :info="item"
                />
                <!-- 饼状图 -->
                <PieChart 
                  v-else-if="item.CHART_TYPE === 'PieChart'"
                  :info="item"
                />
                <!-- 柱状图 -->
                <BarChart 
                  v-else-if="item.CHART_TYPE === 'BarChart'"
                  :info="item"
                />
                <!-- 滚动表格 -->
                <ScrollTable 
                  v-else-if="item.CHART_TYPE === 'ScrollTable'"
                  :info="item"
                />
                <!-- 排名轮播表 -->
                <RankingBoard 
                  v-else-if="item.CHART_TYPE === 'RankingBoard'"
                  :info="item"
                />
              </FrameBox>
            </div>
          </div>
          <div v-else class="loading">
            <el-icon class="loading-icon"><Loading /></el-icon>
            <span>加载中...</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, onUnmounted, computed, watch } from "vue";
import { useRoute } from "vue-router";
import { FullScreen, Crop, Loading } from "@element-plus/icons-vue";
import FrameBox from "./FrameBox.vue";
import DigitalCard from "./DigitalCard.vue";
import LineChart from "./LineChart.vue";
import PieChart from "./PieChart.vue";
import BarChart from "./BarChart.vue";
import ScrollTable from "./ScrollTable.vue";
import RankingBoard from "./RankingBoard.vue";
import api from "@/api/index";

const route = useRoute();

const props = defineProps({
  dataId: {
    type: String,
    default: null
  },
  info: {
    type: Object,
    default: null
  }
});

const isFullscreen = ref(false);
const homeData = ref(null);
const currentTime = ref('');

// 获取parent_id，用于查询首页区块内容
const parentId = computed(() => {
  // 优先从info获取ID，否则从dataId获取
  console.log('props.info:', props.info);
  return props.info?.SQL_ID;
});

// 更新当前时间
const updateCurrentTime = () => {
  const now = new Date();
  const options = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  };
  currentTime.value = now.toLocaleString('zh-CN', options);
};

// 启动时间更新定时器
let timeUpdateInterval = null;

// 处理home数据，添加行列信息（按3行4列网格布局）
const sortedHomeData = computed(() => {
  if (!homeData.value) return [];
  
  // 按SORT_NO排序
  const sorted = homeData.value
    .sort((a, b) => parseInt(a.SORT_NO) - parseInt(b.SORT_NO));
  
  // 计算每个组件的行列位置（3行4列网格）
  const result = [];
  let currentRow = 1;
  let currentCol = 1;
  
  for (const item of sorted) {
    const [rowSpan, colSpan] = item.ROWS_COLUMNS.split('|').map(Number);
    
    // 检查当前位置是否超出网格范围
    if (currentCol + colSpan - 1 > 4) {
      // 换行
      currentRow++;
      currentCol = 1;
    }
    
    // 如果超出3行，重置到第一行（开始新的一页）
    if (currentRow > 3) {
      currentRow = 1;
      currentCol = 1;
    }
    
    result.push({
      ...item,
      rowSpan,
      colSpan,
      row: currentRow,
      col: currentCol
    });
    
    // 移动到下一个位置
    currentCol += colSpan;
    if (currentCol > 4) {
      currentRow++;
      currentCol = 1;
    }
  }
  
  return result;
});

// 调用后台接口获取数据
const fetchHomeData = async () => {
  try {
    // 使用parent_id查询首页区块内容
    const params = parentId.value ? { parent_id: parentId.value } : {};
    const response = await api.executeData('home_list', params);
    console.log('Home data:', JSON.stringify(response, null, 2));
    homeData.value = response;
  } catch (error) {
    console.error('Failed to fetch home data:', error);
  }
};

const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value;
  
  // 通知App组件Home页面的全屏状态变化
  window.dispatchEvent(new CustomEvent('home-fullscreen-change', { detail: isFullscreen.value }));
  
  // 状态变化后，延迟调整图表大小，确保容器尺寸稳定
  setTimeout(() => {
    // 触发窗口 resize 事件，让所有图表组件响应
    window.dispatchEvent(new Event('resize'));
  }, 100);
};

onMounted(() => {
  // 页面加载时获取数据
  fetchHomeData();
  
  // 启动时间更新
  updateCurrentTime();
  timeUpdateInterval = setInterval(updateCurrentTime, 1000);
  
  // 监听App组件的全屏状态变化
  window.addEventListener('home-fullscreen-change', handleAppFullscreenChange);
});

// 监听App组件的全屏状态变化
const handleAppFullscreenChange = (event) => {
  isFullscreen.value = event.detail;
};

// 监听props变化，当info或dataId变化时重新获取数据
watch(
  () => props.info,
  (newInfo) => {
    if (newInfo) {
      fetchHomeData();
    }
  },
  { deep: true }
);

onUnmounted(() => {
  // 清理工作
  // 清理时间更新定时器
  if (timeUpdateInterval) {
    clearInterval(timeUpdateInterval);
  }
  
  // 移除事件监听
  window.removeEventListener('home-fullscreen-change', handleAppFullscreenChange);
});
</script>

<style lang="scss" >
.page {
  padding: 0;
  background-color: var(--bg-color);
  height: 100%;
  overflow: hidden;
  background-image: 
    radial-gradient(circle at 20% 50%, var(--primary-active) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, var(--info-color) 0%, transparent 50%),
    radial-gradient(circle at 40% 80%, var(--success-color) 0%, transparent 50%);

  &.fullscreen {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 9999;
    overflow: hidden;
  }
  
  &.fullscreen .dashboard-container {
    height: 100vh;
    width: 100vw;
    padding: 16px;
  }
  
  &.fullscreen .header {
    height: 40px;
    margin-bottom: 12px;
  }
  
  &.fullscreen .title {
    font-size: 20px;
  }
  
  &.fullscreen .grid-container {
    gap: 16px;
    padding: 16px;
  }

  .dashboard-container {
    height: 100%;
    display: flex;
    flex-direction: column;
    padding: 0 8px 12px 8px;
    box-sizing: border-box;
    position: relative;

    .header-controls {
      position: absolute;
      top: 0;
      right: 8px;
      display: flex;
      align-items: center;
      gap: 16px;
      z-index: 100;
      
      .current-time {
        font-size: 12px;
        color: var(--primary-color);
        text-shadow: 0 0 8px var(--primary-color);
        font-weight: 500;
        white-space: nowrap;
      }
      
      .fullscreen-btn {
        width: 24px;
        height: 24px;
        border-radius: 4px;
        background-color: var(--primary-active);
        border: 1px solid var(--primary-color);
        color: var(--primary-color);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        font-size: 14px;
        transition: all 0.3s ease;

        &:hover {
          background-color: var(--primary-hover);
          border-color: var(--primary-color);
          box-shadow: 0 0 15px var(--primary-color);
        }

        :deep(.el-icon) {
          font-size: 14px;
          color: var(--primary-color);
        }
      }
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      height: 30px;
      margin-bottom: 6px;
      flex-shrink: 0;
      position: relative;
      overflow: hidden;
      
      /* 底层大面积动画 */
      &::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(
          90deg,
          transparent,
          var(--primary-color),
          transparent
        );
        animation: headerFlow 3s ease-in-out infinite;
        z-index: 0;
        opacity: 0.3;
      }

      .header-decoration-left,
      .header-decoration-right {
        display: flex;
        align-items: center;
        position: relative;
        z-index: 1;

        .decoration-line {
          width: 200px;
          height: 1px;
          background: linear-gradient(90deg, transparent, var(--primary-color), transparent);
          position: relative;

          &::before {
            content: '';
            position: absolute;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
            width: 6px;
            height: 6px;
            background: var(--primary-color);
            border-radius: 50%;
            box-shadow: 0 0 10px var(--primary-color);
          }
        }
      }

      .title {
        font-size: 18px;
        font-weight: bold;
        color: var(--primary-color);
        text-shadow: 0 0 10px var(--primary-color);
        letter-spacing: 2px;
        line-height: 1;
        position: relative;
        z-index: 1;
      }

      .header-right {
        display: flex;
        align-items: center;
        color: var(--text-color-secondary);
        position: relative;
        z-index: 1;
      }
    }

    @keyframes headerFlow {
      0% {
        left: -100%;
      }
      100% {
        left: 100%;
      }
    }



    .main-content {
      flex: 1;
      overflow: hidden;
      min-height: 0;

      .content-border {
        width: 100%;
        height: 100%;
        position: relative;
        border: 1px solid var(--border-color);
        border-radius: 8px;
        background: var(--bg-color-light);
        box-shadow: 
          0 0 40px var(--primary-active),
          inset 0 0 40px var(--border-color-light);
        overflow: hidden;
        box-sizing: border-box;

        &::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(90deg, 
            transparent 0%, 
            var(--primary-active) 20%, 
            var(--primary-color) 50%, 
            var(--primary-active) 80%, 
            transparent 100%
          );
          z-index: 1;
        }

        &::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(90deg, 
            transparent 0%, 
            var(--primary-active) 20%, 
            var(--primary-color) 50%, 
            var(--primary-active) 80%, 
            transparent 100%
          );
          z-index: 1;
        }

        .grid-container {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          grid-template-rows: repeat(3, 1fr);
          gap: 12px;
          height: 100%;
          padding: 8px;
          box-sizing: border-box;

          .grid-item {
            display: flex;
            flex-direction: column;
            min-width: 0;
            min-height: 0;
            overflow: hidden;

            &.row-1 {
              grid-row: 1;
            }

            &.row-2 {
              grid-row: 2;
            }

            &.row-3 {
              grid-row: 3;
            }

            &.col-1 {
              grid-column: 1;
            }

            &.col-2 {
              grid-column: 2;
            }

            &.col-3 {
              grid-column: 3;
            }

            &.col-4 {
              grid-column: 4;
            }
          }
        }
      }
    }
  }
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--text-color);
  
  .loading-icon {
    font-size: 32px;
    color: var(--primary-color);
    margin-bottom: 10px;
    animation: spin 1s linear infinite;
  }
  
  span {
    font-size: 14px;
    color: var(--text-color-secondary);
  }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.core-indicators {
  display: flex;
  justify-content: space-around;
  align-items: center;
  height: 100%;
  padding: 10px;

  .indicator-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;

    .indicator-icon {
      .hexagon {
        width: 60px;
        height: 60px;
        background: linear-gradient(135deg, var(--primary-active), var(--primary-hover));
        border: 1px solid var(--primary-color);
        clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 0 15px var(--primary-color);

        .hex-content {
          font-size: 24px;
          font-weight: bold;
          color: var(--primary-color);
          text-shadow: 0 0 10px var(--primary-color);
        }
      }
    }

    .indicator-info {
      text-align: center;

      .indicator-value {
        font-size: 16px;
        font-weight: bold;
        color: var(--primary-color);
        text-shadow: 0 0 8px var(--primary-color);
      }

      .indicator-label {
        font-size: 12px;
        color: var(--text-color-secondary);
        margin-top: 4px;
      }
    }
  }
}

.risk-indicators {
  position: relative;
  height: 100%;
  padding: 10px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;

  .risk-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 0;
    border-bottom: 1px solid var(--border-color-light);

    .risk-label {
      font-size: 12px;
      color: var(--text-color-secondary);
    }

    .risk-value {
      font-size: 14px;
      font-weight: bold;
      color: var(--primary-color);
      text-shadow: 0 0 8px var(--primary-color);
    }
  }

  .risk-center {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 1;

    .diamond {
      width: 80px;
      height: 80px;
      background: linear-gradient(135deg, var(--primary-active), var(--primary-hover));
      border: 1px solid var(--primary-color);
      transform: rotate(45deg);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 0 20px var(--primary-color);

      .diamond-content {
        font-size: 12px;
        font-weight: bold;
        color: var(--primary-color);
        text-shadow: 0 0 10px var(--primary-color);
        transform: rotate(-45deg);
        text-align: center;
      }
    }
  }
}

.funnel-chart {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 8px;

  .funnel-item {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    box-shadow: 0 0 10px var(--primary-active);
    padding: 8px 16px;
    transition: all 0.3s ease;

    &.level-1 {
      width: 80%;
      background: linear-gradient(90deg, var(--primary-active), var(--primary-hover));
      border: 1px solid var(--primary-color);

      &:hover {
        box-shadow: 0 0 15px var(--primary-color);
      }
    }

    &.level-2 {
      width: 70%;
      background: linear-gradient(90deg, rgba(82, 196, 26, 0.2), rgba(82, 196, 26, 0.4));
      border: 1px solid var(--success-color);

      &:hover {
        box-shadow: 0 0 15px var(--success-color);
      }
    }

    &.level-3 {
      width: 60%;
      background: linear-gradient(90deg, rgba(250, 173, 20, 0.2), rgba(250, 173, 20, 0.4));
      border: 1px solid var(--warning-color);

      &:hover {
        box-shadow: 0 0 15px var(--warning-color);
      }
    }

    &.level-4 {
      width: 50%;
      background: linear-gradient(90deg, rgba(255, 120, 117, 0.2), rgba(255, 120, 117, 0.4));
      border: 1px solid var(--danger-color);

      &:hover {
        box-shadow: 0 0 15px var(--danger-color);
      }
    }

    .funnel-label {
      font-size: 12px;
      color: var(--text-color);
      text-shadow: 0 0 8px var(--primary-color);
      margin-right: 10px;
    }

    .funnel-value {
      font-size: 14px;
      font-weight: bold;
      color: var(--text-color);
      text-shadow: 0 0 8px var(--primary-color);
    }
  }
}
</style>
