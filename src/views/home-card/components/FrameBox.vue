/**
 * 框架容器组件
 * @component
 * @description 用于包裹其他组件，提供统一的边框、标题和样式
 * @props {string} title - 容器标题
 * @slot default - 容器内容插槽
 * @example 
 */
<template>
  <div class="frame-box">
    <div class="frame-header">
    <div class="header-decoration-left"></div>
    <div class="header-title">
      <span>{{ title }}</span>
    </div>
    <div class="header-decoration-right"></div>
  </div>
    <div class="frame-content">
      <slot></slot>
    </div>
  </div>
</template>

<script setup>
import { defineProps } from "vue";

const props = defineProps({
  title: {
    type: String,
    default: ""
  }
});
</script>

<style lang="scss" scoped>
.frame-box {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  background: #ffffff;
  box-shadow: 
    0 2px 12px 0 rgba(0, 0, 0, 0.1),
    inset 0 0 10px rgba(64, 158, 255, 0.05);
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, 
      transparent 0%, 
      rgba(64, 158, 255, 0.3) 20%, 
      #409EFF 50%, 
      rgba(64, 158, 255, 0.3) 80%, 
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
      rgba(64, 158, 255, 0.3) 20%, 
      #409EFF 50%, 
      rgba(64, 158, 255, 0.3) 80%, 
      transparent 100%
    );
    z-index: 1;
  }
  
  .frame-header {
    display: flex;
    align-items: center;
    height: 25px;
    padding: 0 16px;
    background: linear-gradient(90deg, rgba(64, 158, 255, 0.1), transparent);
    border-bottom: 1px solid #e4e7ed;
    position: relative;
    z-index: 2;
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
        rgba(64, 158, 255, 0.5),
        transparent
      );
      animation: headerFlow 2.5s ease-in-out infinite;
      z-index: 0;
      opacity: 0.3;
    }
    
    .header-decoration-left,
    .header-decoration-right {
      flex: 1;
      height: 2px;
      background: linear-gradient(90deg, 
        #409EFF, 
        transparent
      );
      position: relative;
      z-index: 1;
      
      &::before {
        content: '';
        position: absolute;
        left: 0;
        top: 50%;
        transform: translate(0, -50%);
        width: 6px;
        height: 6px;
        background: #409EFF;
        border-radius: 50%;
        box-shadow: 0 0 8px rgba(64, 158, 255, 0.5);
      }
    }
    
    .header-decoration-right {
      background: linear-gradient(90deg, 
        transparent, 
        #409EFF
      );
      
      &::before {
        left: auto;
        right: 0;
      }
    }
    
    .header-title {
      flex-shrink: 0;
      font-size: 14px;
      font-weight: 700;
      color: #303133;
      white-space: nowrap;
      margin: 0 12px;
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


  
  .frame-content {
    flex: 1;
    padding: 12px;
    box-sizing: border-box;
    overflow: hidden;
  }
}
</style>
