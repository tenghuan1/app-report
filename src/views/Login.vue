<template>
  <div :class="b('login')">
    <div :class="e('login', 'container')">
      <div :class="e('login', 'header')">
        <h1 :class="e('login', 'title')">院长查询系统</h1>
        <p :class="e('login', 'subtitle')">欢迎登录</p>
      </div>
      
      <el-form 
        :class="e('login', 'form')" 
        :model="loginForm" 
        :rules="loginRules"
        ref="loginFormRef"
      >
        <el-form-item :class="e('login', 'form-item')" prop="userId">
          <el-input 
            :class="e('login', 'input')"
            v-model="loginForm.userId" 
            placeholder="请输入账号"
            prefix-icon="User"
            size="large"
          />
        </el-form-item>
        
        <el-form-item :class="e('login', 'form-item')" prop="password">
          <el-input 
            :class="e('login', 'input')"
            v-model="loginForm.password" 
            type="password" 
            placeholder="请输入密码"
            prefix-icon="Lock"
            size="large"
            show-password
            @keyup.enter="handleLogin"
          />
        </el-form-item>
        
        <el-form-item :class="e('login', 'form-item')">
          <el-button 
            :class="cls(e('login', 'button'), m('login', 'primary'))"
            type="primary" 
            size="large"
            :loading="loading"
            @click="handleLogin"
          >
            登录
          </el-button>
        </el-form-item>
      </el-form>
      
      <div :class="e('login', 'tips')">
        <p>请输入数据库中的账号和密码</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { b, e, m, cls } from '../utils/bem';
import api from "@/api";

const router = useRouter();
const loginFormRef = ref(null);
const loading = ref(false);

const loginForm = reactive({
  userId: "",
  password: "",
});

const loginRules = {
  userId: [
    { required: true, message: "请输入账号", trigger: "blur" },
    { min: 3, max: 20, message: "长度在 3 到 20 个字符", trigger: "blur" },
  ],
  password: [
    { required: true, message: "请输入密码", trigger: "blur" },
    { min: 6, max: 20, message: "长度在 6 到 20 个字符", trigger: "blur" },
  ],
};

const handleLogin = async () => {
  if (!loginFormRef.value) return;
  
  await loginFormRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true;
      
      try {
        // 调用LOGIN_CHECK接口验证用户登录
        const result = await api.executeData('LOGIN_CHECK', {
          userId: loginForm.userId,
          password: loginForm.password
        });
        
        console.log('登录接口返回结果:', result);
        // 检查接口返回结果
        if (result?.length > 0) {
          // 登录成功，存储登录状态
          const username = result[0].NAME || loginForm.userId;
          localStorage.setItem("isLoggedIn", "true");
          localStorage.setItem("username", username);
          localStorage.setItem("password", result[0].PASSWORD);
          localStorage.setItem("usercode", result[0].CODE);
          
          // 存储用户信息，用于路由守卫检查
          localStorage.setItem('userInfo', JSON.stringify({
            username: username,
            name: username
          }));
          
          // 触发自定义事件通知App.vue更新用户名
          window.dispatchEvent(new CustomEvent('username-updated', { detail: username }));
          
          ElMessage.success(username + " 登录成功！");
          router.push("/");
        } else {
          // 登录失败
          ElMessage.error(result?.message || "登录失败，请检查用户名和密码！");
        }
      } catch (error) {
        console.error('登录接口调用失败:', error);
        ElMessage.error('登录失败，系统异常！');
      } finally {
        loading.value = false;
      }
    }
  });
};
</script>