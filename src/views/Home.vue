<template>
  <div class="home">
    <!-- 标题栏 -->
    <div class="home__header">
      <div class="home__header-left">
        <span class="home__header-system-name">院长查询系统</span>
        <!-- 顶部菜单 -->
        <el-menu :default-active="activeMenu" class="home__header-menu" mode="horizontal" @select="handleMenuSelect">
          <template v-for="menu in menuItems" :key="menu.id">
            <!-- 有子菜单的情况 -->
            <el-sub-menu v-if="menu.children && menu.children.length > 0" :index="`/page/${menu.id}`">
              <template #title>
                <span>{{ menu.name }}</span>
              </template>
              <el-menu-item v-for="child in menu.children" :key="child.id" :index="`/page/${child.id}`"
                @click="handleMenuItemClick(child)">
                <span>{{ child.name }}</span>
              </el-menu-item>
            </el-sub-menu>
            <!-- 没有子菜单的情况 -->
            <el-menu-item v-else :index="menu.isHome ? '/' : `/page/${menu.id}`" @click="handleMenuItemClick(menu)">
              <span>{{ menu.name }}</span>
            </el-menu-item>
          </template>
        </el-menu>
      </div>
      <div class="home__header-right">
        <el-button type="primary" size="small" @click="showSettings">
          <el-icon><Setting /></el-icon>
          设置
        </el-button>
        <span class="home__header-user-info">登录人：{{ userInfo.name }}</span>
        <el-button type="danger" size="small" @click="handleLogout">退出登录</el-button>
      </div>
    </div>

    <!-- 主内容区 -->
    <div class="home__main-container">
      <!-- 右侧内容区域 -->
      <div class="home__content-area">
        <router-view />
      </div>
    </div>

    <!-- 设置对话框 -->
    <el-dialog
      v-model="settingsVisible"
      title="系统设置"
      width="400px"
      :close-on-click-modal="false"
    >
      <el-form :model="settingsForm" label-width="120px">
        <el-form-item label="自动刷新时间">
          <el-input-number
            v-model="settingsForm.refreshInterval"
            :min="1"
            :max="3600"
            :step="1"
            controls-position="right"
            style="width: 150px"
          />
          <span style="margin-left: 8px">秒</span>
        </el-form-item>
        <el-form-item label="启用自动刷新">
          <el-switch v-model="settingsForm.refreshEnabled" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="settingsVisible = false">取消</el-button>
          <el-button type="primary" @click="saveSettings">保存</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Setting } from '@element-plus/icons-vue'
import api from '../api'
import { useMenuStore } from '../stores/menu'

const router = useRouter()
const menuItems = ref([])
const activeMenu = ref("")
const menuStore = useMenuStore()

// 设置对话框显示状态
const settingsVisible = ref(false)

// 设置表单数据
const settingsForm = reactive({
  refreshInterval: 5, // 默认5秒
  refreshEnabled: true // 默认启用
})

// 显示设置对话框
const showSettings = () => {
  // 从localStorage加载当前设置
  const savedInterval = localStorage.getItem('refreshInterval')
  const savedEnabled = localStorage.getItem('refreshEnabled')
  
  if (savedInterval) {
    settingsForm.refreshInterval = parseInt(savedInterval)
  }
  if (savedEnabled !== null) {
    settingsForm.refreshEnabled = savedEnabled === 'true'
  }
  
  settingsVisible.value = true
}

// 保存设置
const saveSettings = () => {
  // 保存到localStorage
  localStorage.setItem('refreshInterval', settingsForm.refreshInterval.toString())
  localStorage.setItem('refreshEnabled', settingsForm.refreshEnabled.toString())
  
  // 触发全局事件通知所有组件刷新设置已更新
  window.dispatchEvent(new CustomEvent('refresh-settings-updated'))
  
  ElMessage.success('设置保存成功')
  settingsVisible.value = false
}

// 从 localStorage 获取用户信息
const getUserInfo = () => {
  const userInfoStr = localStorage.getItem('userInfo')
  if (userInfoStr) {
    return JSON.parse(userInfoStr)
  }
  return { name: '未知', department: '未知' }
}

const userInfo = reactive(getUserInfo())

// 退出登录
const handleLogout = () => {
  ElMessageBox.confirm('确定要退出登录吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    // 清除登录信息
    localStorage.removeItem('userInfo')
    ElMessage.success('已退出登录')
    // 跳转到登录页
    router.push('/login')
  }).catch(() => {
    // 取消退出
  })
}

// 处理菜单选择
const handleMenuSelect = (index) => {
  // 如果不是home-card路由，正常跳转
  if (!index.includes('/home-card/')) {
    router.push(index)
  }
}

// 处理菜单项点击
const handleMenuItemClick = (menuItem) => {
  // 检查是否是home类型
  if (menuItem?.chartType === 'HomeCard') {
    // 存储菜单信息到Pinia store
    menuStore.setCurrentMenu(menuItem.info)
    // 跳转到home-card页面
    router.push('/home-card')
  } 
  else if (menuItem?.chartType === 'HomeBi') {
    // 存储菜单信息到Pinia store
    menuStore.setCurrentMenu(menuItem.info)
    // 跳转到home-bi页面
    router.push('/home-bi')
  }
  else if (menuItem?.chartType === 'HomeTable') {
    // 存储菜单信息到Pinia store
    menuStore.setCurrentMenu(menuItem.info)
    // 跳转到home-table页面
    router.push('/home-table')
  }
  else {
    // 普通菜单项，正常跳转
    const path = menuItem.isHome ? '/' : `/page/${menuItem.id}`
    router.push(path)
  }
}

// 加载菜单配置
const loadMenuConfig = async () => {
  try {
    const result = await api.executeData('REPORT_LIST');
    console.log('菜单接口返回结果:', result);

    if (result && result.length > 0) {
      const parentMenu = result.filter(item => !item.PARENT_ID).map(item => ({
        id: item.ID,
        name: item.NAME,
        sortNo: item.SORT_NO,
        sqlId: item.SQL_ID,
        validFlag: item.VALID_FLAG,
        icon: item.PARENT_ID ? 'Document' : 'FolderOpened',
        chartType: item.CHART_TYPE,
        children: [],
        info: item
      }));
      parentMenu.forEach(parent => {
        const children = result.filter(item => item.PARENT_ID === parent.id).map(item => ({
          id: item.ID,
          name: item.NAME,
          parentId: item.PARENT_ID,
          sortNo: item.SORT_NO,
          validFlag: item.VALID_FLAG,
          icon: 'Document',
          children: [],
          chartType: item.CHART_TYPE,
          info: item
        }));
        parent.children = children;
      });

      console.log('加载菜单成功:', parentMenu);
      menuItems.value = parentMenu;
    } else {
      console.log('菜单数据为空');
    }
  } catch (error) {
    console.error('加载菜单失败:', error);
    ElMessage.error('加载菜单失败');
  }
};

onMounted(async () => {
  // 加载菜单配置
  await loadMenuConfig();


})
</script>

<style scoped>
.home__header {
  background-color: #409EFF !important;
  color: white !important;
}

.home__header-left {
  display: flex !important;
  align-items: center !important;
  gap: 30px !important;
  flex: 1 !important;
}

.home__header-right {
  display: flex !important;
  align-items: center !important;
  gap: 20px !important;
  font-size: 14px !important;
  padding-right: 20px !important;
}

.home__header-system-name {
  font-size: 18px !important;
  font-weight: bold !important;
  white-space: nowrap !important;
}

.home__header-menu {
  flex: 1 !important;
}

:deep(.el-menu) {
  background-color: transparent !important;
  border-bottom: none !important;
}

:deep(.el-menu-item),
:deep(.el-sub-menu__title) {
  color: white !important;
  border-bottom: none !important;
}

:deep(.el-menu-item:hover),
:deep(.el-sub-menu__title:hover) {
  background-color: rgba(255, 255, 255, 0.1) !important;
}

:deep(.el-menu-item.is-active),
:deep(.el-sub-menu__title.is-active) {
  color: white !important;
  background-color: rgba(255, 255, 255, 0.2) !important;
}

:deep(.el-sub-menu .el-menu) {
  background-color: #409EFF !important;
  border: none !important;
}

:deep(.el-sub-menu .el-menu .el-menu-item) {
  color: white !important;
  border-bottom: none !important;
}

:deep(.el-sub-menu .el-menu .el-menu-item:hover) {
  background-color: rgba(255, 255, 255, 0.1) !important;
}

:deep(.el-sub-menu .el-menu .el-menu-item.is-active) {
  background-color: rgba(255, 255, 255, 0.2) !important;
}
</style>