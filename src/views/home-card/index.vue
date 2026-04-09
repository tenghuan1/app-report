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
    <div class="page">
        <div class="dashboard-container" :class="{ 'maximized': isMaximized }">
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
                                <!-- 费用预警组件 -->
                                <ExpenseAlert v-else-if="item.CHART_TYPE === 'ExpenseAlert'" :info="item" />
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
                                <!-- 费用预警组件 -->
                                <ExpenseAlert v-else-if="item.CHART_TYPE === 'ExpenseAlert'" :info="item" />
                            </template>
                        </div>
                    </div>
                    <div v-else-if="loading" class="loading">
                        <el-icon class="loading-icon">
                            <Loading />
                        </el-icon>
                        <span>加载中...</span>
                    </div>
                    <div v-else class="no-data">
                        <el-empty description="暂无数据" />
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, onActivated, computed, watch } from "vue";
import { useRoute } from "vue-router";
import { Loading } from "@element-plus/icons-vue";

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
import ExpenseAlert from "./components/ExpenseAlert.vue";
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

const homeData = ref(null);
const loading = ref(false);

// 获取parent_id，用于查询首页区块内容
const parentId = computed(() => {
    // 直接从props.info获取SQL_ID
    const info = props.info;
    console.log('props.info:', props.info);
    console.log('Using info:', info);
    console.log('info?.SQL_ID:', info?.SQL_ID);
    console.log('info?.sqlId:', info?.sqlId);
    console.log('info?.info?.SQL_ID:', info?.info?.SQL_ID);
    console.log('info?.info?.sqlId:', info?.info?.sqlId);
    // 尝试从多个可能的位置获取SQL_ID
    // 首先尝试info.sqlId（从Home.vue传递的菜单对象）
    // 然后尝试info.info.SQL_ID（原始菜单项数据）
    const result = info?.sqlId || info?.SQL_ID || info?.info?.SQL_ID || info?.info?.sqlId;
    console.log('Final parentId:', result);
    return result;
});

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
    console.log('Starting fetchHomeData');
    loading.value = true;
    // 设置请求超时时间
    const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), 15000); // 15秒超时
    });
    
    try {
        // 使用parent_id查询首页区块内容
        const params = parentId.value ? { parent_id: parentId.value } : {};
        console.log('Fetching home data with params:', params);
        console.log('Calling api.executeData with sqlId: home_list, params:', params);
        // 同时执行请求和超时检查
        const response = await Promise.race([
            api.executeData('home_list', params),
            timeoutPromise
        ]);
        console.log('Home data response:', response);
        console.log('Home data:', JSON.stringify(response, null, 2));
        homeData.value = response;
    } catch (error) {
        console.error('Failed to fetch home data:', error);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        homeData.value = []; // 出错时设置为空数组，避免一直显示加载中
    } finally {
        console.log('Setting loading to false');
        loading.value = false;
    }
};

onMounted(() => {
    // 组件挂载时立即获取数据
    fetchHomeData();
});

// 组件激活时触发（keep-alive缓存后）
onActivated(() => {
    fetchHomeData();
});

// 监听parentId变化，重新获取数据
watch(parentId, () => {
    console.log('parentId changed, fetching data');
    fetchHomeData();
});



// 监听props.info变化，重新获取数据
watch(() => props.info, () => {
    console.log('props.info changed, fetching data');
    fetchHomeData();
}, { deep: true });
</script>

<style scoped>
.page {
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
    overflow: hidden;
    position: relative;
}

.dashboard-container {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
    position: relative;
    overflow: hidden;
    transition: all 0.3s ease;
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
    padding: 10px;
    box-sizing: border-box;
    background: rgba(255, 255, 255, 0.9);
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
    overflow: hidden;
}

.grid-container {
    display: grid;
    grid-template-columns: repeat(13, 1fr);
    grid-template-rows: repeat(9, minmax(0, 1fr));
    gap: 10px;
    width: 100%;
    height: 100%;
    overflow: hidden;
}

.grid-item {
    min-height: 0;
    min-width: 0;
    max-height: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
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

.no-data {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
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
