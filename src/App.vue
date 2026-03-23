<template>
  <div style="width: 100vw; height: 100vh;">
    <keep-alive :include="['HomeCard']">
      <router-view />
    </keep-alive>
  </div>
</template>

<script setup>
// App component
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  width: 100%;
  height: 100%;
  font-family: 'Arial', sans-serif;
}

#app {
  width: 100%;
  height: 100%;
}
</style>