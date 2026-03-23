import axios from "axios";

// 创建axios实例
const service = axios.create({
  baseURL: "", // 使用相对路径，通过Vite代理发送请求
  timeout: 10000, // 请求超时时间
  headers: {
    "Content-Type": "application/json",
  },
});

// 请求拦截器
service.interceptors.request.use(
  (config) => {
    // 可以在这里添加token等认证信息
    // const token = localStorage.getItem('token')
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`
    // }
    return config;
  },
  (error) => {
    console.error("请求错误:", error);
    return Promise.reject(error);
  }
);

// 响应拦截器
service.interceptors.response.use(
  (response) => {
    const res = response.data;
    // 如果响应数据中包含data字段，直接返回data的内容
    if (res && res.data !== undefined) {
      return JSON.parse(res.data);
    }
    return res;
  },
  (error) => {
    console.error("响应错误:", error);
    return Promise.reject(error);
  }
);

export default service;
