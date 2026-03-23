import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue'),
    meta: { public: true }
  },
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/Home.vue'),
    children: [
      {
        path: '/home-card',
        name: 'HomeCard',
        component: () => import('../views/home-card/index.vue')
      },
      {
        path: '/home-table',
        name: 'HomeTable',
        component: () => import('../views/home-table/index.vue')
      },
    ]
  },

]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫 - 登录验证
router.beforeEach((to, from, next) => {
  const userInfo = localStorage.getItem('userInfo')
  
  // 如果是公开页面（如登录页），直接放行
  if (to.meta.public) {
    next()
    return
  }
  
  // 如果没有登录信息，跳转到登录页
  if (!userInfo) {
    next('/login')
    return
  }
  
  next()
})

export default router