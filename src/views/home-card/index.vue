/**
 * HomeCard页面组件
 * @component
 * @description 用于展示医院经营数据的看板页面，支持多种数据可视化组件和全屏模式
 * @props {string} dataId - 数据ID（可选）
 * @props {Object} info - 配置信息（可选）
 * @props {string} info.SQL_ID - SQL查询ID，用于获取数据
 * @example <HomeCard :info="menuItem.info" />
 */
<template>
    <div class="page" :class="{ 'fullscreen': isFullscreen }">
        <div class="dashboard-container">
            <!-- 全屏按钮和时间显示 -->
            <div class="header-controls">
                <div class="fullscreen-btn" @click="toggleFullscreen">
                    <el-icon v-if="!isFullscreen">
                        <FullScreen />
                    </el-icon>
                    <el-icon v-else>
                        <Crop />
                    </el-icon>
                </div>
            </div>

            <!-- 主内容区域 -->
            <div class="main-content">
                <div class="content-border">
                    <div class="grid-container" v-if="homeData && homeData.length > 0">
                        <div v-for="item in sortedHomeData" :key="item.ID"
                            :class="['grid-item', `row-${item.row}`, `col-${item.col}`]" :style="{
                                gridRow: `span ${item.rowSpan}`,
                                gridColumn: `span ${item.colSpan}`
                            }">
                            <!-- 有边框 -->
                            <FrameBox v-if="item.HAS_BORDER === '1'" :title="item.NAME">
                                <!-- 数字翻牌器 -->
                                <DigitalCard v-if="item.CHART_TYPE === 'DigitalCard'" :info="item" />
                                <!-- 浅色卡片 -->
                                <LightCard v-else-if="item.CHART_TYPE === 'LightCard'" :info="item" />
                                <!-- 垂直卡片 -->
                                <VerticalCard v-else-if="item.CHART_TYPE === 'VerticalCard'" :info="item" />
                                <!-- 带信息的柱状图 -->
                                <BarChartWithInfo v-else-if="item.CHART_TYPE === 'BarChartWithInfo'" :info="item" />
                                <!-- 双滚动表格 -->
                                <DoubleScrollTable v-else-if="item.CHART_TYPE === 'DoubleScrollTable'" :info="item" />
                                <!-- 百分比带排名组件 -->
                                <PercentageWithRankingsComponent v-else-if="item.CHART_TYPE === 'PercentageWithRankingsComponent'" :info="item" />
                                <!-- 折线图 -->
                                <LineChart v-else-if="item.CHART_TYPE === 'LineChart'" :info="item" />
                                <!-- 饼状图 -->
                                <PieChart v-else-if="item.CHART_TYPE === 'PieChart'" :info="item" />
                                <!-- 柱状图 -->
                                <BarChart v-else-if="item.CHART_TYPE === 'BarChart'" :info="item" />
                                <!-- 滚动表格 -->
                                <ScrollTable v-else-if="item.CHART_TYPE === 'ScrollTable'" :info="item" />
                                <!-- 排名轮播表 -->
                                <RankingBoard v-else-if="item.CHART_TYPE === 'RankingBoard'" :info="item" />
                            </FrameBox>
                            <!-- 无边框 -->
                            <template v-else>
                                <!-- 数字翻牌器 -->
                                <DigitalCard v-if="item.CHART_TYPE === 'DigitalCard'" :info="item" />
                                <!-- 浅色卡片 -->
                                <LightCard v-else-if="item.CHART_TYPE === 'LightCard'" :info="item" />
                                <!-- 垂直卡片 -->
                                <VerticalCard v-else-if="item.CHART_TYPE === 'VerticalCard'" :info="item" />
                                <!-- 带信息的柱状图 -->
                                <BarChartWithInfo v-else-if="item.CHART_TYPE === 'BarChartWithInfo'" :info="item" />
                                <!-- 双滚动表格 -->
                                <DoubleScrollTable v-else-if="item.CHART_TYPE === 'DoubleScrollTable'" :info="item" />
                                <!-- 百分比带排名组件 -->
                                <PercentageWithRankingsComponent v-else-if="item.CHART_TYPE === 'PercentageWithRankingsComponent'" :info="item" />
                                <!-- 折线图 -->
                                <LineChart v-else-if="item.CHART_TYPE === 'LineChart'" :info="item" />
                                <!-- 饼状图 -->
                                <PieChart v-else-if="item.CHART_TYPE === 'PieChart'" :info="item" />
                                <!-- 柱状图 -->
                                <BarChart v-else-if="item.CHART_TYPE === 'BarChart'" :info="item" />
                                <!-- 滚动表格 -->
                                <ScrollTable v-else-if="item.CHART_TYPE === 'ScrollTable'" :info="item" />
                                <!-- 排名轮播表 -->
                                <RankingBoard v-else-if="item.CHART_TYPE === 'RankingBoard'" :info="item" />
                            </template>
                        </div>
                    </div>
                    <div v-else class="loading">
                        <el-icon class="loading-icon">
                            <Loading />
                        </el-icon>
                        <span>加载中...</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, onUnmounted, onActivated, computed, watch } from "vue";
import { useRoute } from "vue-router";
import { FullScreen, Crop, Loading } from "@element-plus/icons-vue";

// 组件名称，用于keep-alive缓存
defineOptions({ name: 'HomeCard' });

import FrameBox from "./components/FrameBox.vue";
import DigitalCard from "./components/DigitalCard.vue";
import LineChart from "./components/LineChart.vue";
import PieChart from "./components/PieChart.vue";
import BarChart from "./components/BarChart.vue";
import ScrollTable from "./components/ScrollTable.vue";
import RankingBoard from "./components/RankingBoard.vue";
import LightCard from "./components/LightCard.vue";
import VerticalCard from "./components/VerticalCard.vue";
import BarChartWithInfo from "./components/BarChartWithInfo.vue";
import DoubleScrollTable from "./components/DoubleScrollTable.vue";
import PercentageWithRankingsComponent from "./components/PercentageWithRankingsComponent.vue";
import api from "@/api/index";
import { useMenuStore } from "@/stores/menu";

const route = useRoute();
const menuStore = useMenuStore();

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

// 从Pinia store获取菜单信息
const routeInfo = computed(() => {
    return menuStore.getCurrentMenu;
});

// 获取parent_id，用于查询首页区块内容
const parentId = computed(() => {
    // 优先从Pinia store获取info，然后props.info，最后dataId
    const info = routeInfo.value || props.info;
    console.log('routeInfo (from store):', routeInfo.value);
    console.log('props.info:', props.info);
    console.log('Using info:', info);
    return info?.SQL_ID;
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

// 处理home数据，添加行列信息（按9行13列网格布局）
const sortedHomeData = computed(() => {
    if (!homeData.value) return [];

    // 按SORT_NO排序
    const sorted = homeData.value
        .sort((a, b) => parseInt(a.SORT_NO) - parseInt(b.SORT_NO));

    // 计算每个组件的行列位置（9行13列网格）
    const result = [];
    let currentRow = 1;
    let currentCol = 1;

    for (const item of sorted) {
        // 横向占几格 * 纵向占几格
        const [colSpan, rowSpan] = item.ROWS_COLUMNS.split('*').map(Number);

        // 检查当前位置是否超出网格范围
        if (currentCol + colSpan - 1 > 13) {
            // 换行
            currentRow++;
            currentCol = 1;
        }

        // 如果超出9行，重置到第一行（开始新的一页）
        if (currentRow > 9) {
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
        if (currentCol > 13) {
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
    if (isFullscreen.value) {
        document.documentElement.requestFullscreen?.();
    } else {
        document.exitFullscreen?.();
    }
};

// 监听全屏变化事件
const handleFullscreenChange = () => {
    isFullscreen.value = !!document.fullscreenElement;
};

onMounted(() => {
    updateCurrentTime();
    timeUpdateInterval = setInterval(updateCurrentTime, 1000);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
});

// 组件激活时触发（keep-alive缓存后）
onActivated(() => {
    if (parentId.value) {
        fetchHomeData();
    }
});

onBeforeUnmount(() => {
    if (timeUpdateInterval) {
        clearInterval(timeUpdateInterval);
    }
    document.removeEventListener('fullscreenchange', handleFullscreenChange);
});

// 监听parentId变化，重新获取数据
watch(parentId, (newVal) => {
    if (newVal) {
        fetchHomeData();
    }
});
</script>

<style scoped>
.page {
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
    overflow: hidden;
    position: relative;
}

.page.fullscreen {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    z-index: 9999;
}

.dashboard-container {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
    position: relative;
}

.header {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px 0;
    position: relative;
}

.header-decoration-left,
.header-decoration-right {
    flex: 1;
    display: flex;
    align-items: center;
}

.header-decoration-left {
    justify-content: flex-end;
}

.decoration-line {
    height: 2px;
    background: linear-gradient(90deg, transparent, #409EFF, transparent);
    width: 200px;
}

.title {
    font-size: 36px;
    font-weight: bold;
    color: #409EFF;
    text-shadow: 0 0 10px rgba(64, 158, 255, 0.3);
    margin: 0 40px;
    letter-spacing: 8px;
}

.header-controls {
    position: absolute;
    top: 30px;
    right: 40px;
    display: flex;
    align-items: center;
    gap: 20px;
    z-index: 100;
}

.current-time {
    font-size: 18px;
    color: #303133;
    font-family: 'Courier New', monospace;
}

.fullscreen-btn {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    background: rgba(64, 158, 255, 0.1);
    border: 1px solid rgba(64, 158, 255, 0.3);
    border-radius: 8px;
    transition: all 0.3s ease;
}

.fullscreen-btn:hover {
    background: rgba(64, 158, 255, 0.2);
    border-color: rgba(64, 158, 255, 0.5);
    transform: scale(1.1);
}

.fullscreen-btn .el-icon {
    font-size: 24px;
    color: #409EFF;
}

.main-content {
    flex: 1;
    overflow: hidden;
}

.content-border {
    width: 100%;
    height: 100%;
    border: 1px solid rgba(64, 158, 255, 0.2);
    border-radius: 12px;
    padding: 20px;
    box-sizing: border-box;
    background: rgba(255, 255, 255, 0.9);
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.grid-container {
    display: grid;
    grid-template-columns: repeat(13, 1fr);
    grid-template-rows: repeat(9, 1fr);
    gap: 20px;
    width: 100%;
    height: 100%;
}

.grid-item {
    min-height: 0;
    min-width: 0;
}

.loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: #409EFF;
    font-size: 18px;
    gap: 20px;
}

.loading-icon {
    font-size: 48px;
    animation: rotate 1s linear infinite;
}

@keyframes rotate {
    from {
        transform: rotate(0deg);
    }

    to {
        transform: rotate(360deg);
    }
}
</style>
