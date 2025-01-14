<template>
  <div class="app">
    <a-layout>
      <a-layout-header class="header">
        <h1>年会抽奖助手</h1>
      </a-layout-header>
      <a-layout-content class="content">
        <lucky-draw />
      </a-layout-content>
      <a-layout-footer class="footer">
        年会抽奖助手 ©2024 Created by Your Company
      </a-layout-footer>
    </a-layout>
  </div>
</template>

<script setup>
import LuckyDraw from './components/LuckyDraw/LuckyDraw.vue'
</script>

<style>
.app {
  min-height: 100vh;
}

.header {
  background: #fff;
  padding: 0 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.header h1 {
  margin: 0;
  color: #1890ff;
  line-height: 64px;
}

.content {
  background: #fff;
  min-height: calc(100vh - 64px - 70px);
}

.footer {
  text-align: center;
  color: rgba(0, 0, 0, 0.45);
  padding: 24px 0;
}
</style>
