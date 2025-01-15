<template>
  <div class="app">
    <a-layout>
      <a-layout-header class="header">
        <div class="header-content">
          <h1>
            <span class="event-name">2024年承信&目光年会</span>
          </h1>
          <div 
            class="header-fullscreen-btn"
            @click="toggleFullscreen"
          >
            <FullscreenOutlined v-if="!isFullscreen" />
            <FullscreenExitOutlined v-else />
          </div>
        </div>
      </a-layout-header>
      <a-layout-content class="content">
        <lucky-draw />
      </a-layout-content>
      <a-layout-footer class="footer">
        <span>Copyright © 2025 杭州目光科技有限公司</span>
      </a-layout-footer>
    </a-layout>
  </div>
</template>

<script setup>
import LuckyDraw from './components/LuckyDraw/LuckyDraw.vue'
import { FullscreenOutlined, FullscreenExitOutlined } from '@ant-design/icons-vue'
import { ref, onMounted } from 'vue'

const isFullscreen = ref(false)

const toggleFullscreen = async () => {
  console.log('toggleFullscreen', document.fullscreenElement)
  if (!document.fullscreenElement) {
    try {
      await document.documentElement.requestFullscreen()
      isFullscreen.value = true
    } catch (err) {
      console.error('Error attempting to enable full-screen:', err)
    }
  } else {
    try {
      if (document.exitFullscreen) {
        await document.exitFullscreen()
        isFullscreen.value = false
      }
    } catch (err) {
      console.error('Error attempting to exit full-screen:', err)
    }
  }
}

onMounted(() => {
  document.addEventListener('fullscreenchange', () => {
    isFullscreen.value = !!document.fullscreenElement
  })
})
</script>

<style>
.app {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
}

:deep(.ant-layout) {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: transparent;
}

.header {
  flex: none;
  background: linear-gradient(135deg, #B11E31 0%, #D4173B 50%, #B11E31 100%);
  padding: 0;
  box-shadow: 0 4px 20px rgba(177, 30, 49, 0.4);
  position: relative;
  z-index: 1;
  overflow: hidden;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.header::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: 
    radial-gradient(circle at 0% 0%, rgba(255, 223, 0, 0.15) 0%, transparent 30%),
    radial-gradient(circle at 100% 100%, rgba(255, 223, 0, 0.15) 0%, transparent 30%),
    linear-gradient(90deg, 
      rgba(255, 223, 0, 0) 0%,
      rgba(255, 223, 0, 0.1) 50%,
      rgba(255, 223, 0, 0) 100%
    );
  animation: bgShine 8s ease-in-out infinite;
}

.header::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: 
    url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M40 0L46 34H34L40 0zM40 80L34 46H46L40 80zM80 40L46 46V34L80 40zM0 40L34 34V46L0 40zM57 23L57 57L23 57L23 23z' fill='%23FFD700' fill-opacity='0.05'/%3E%3C/svg%3E"),
    url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='20' cy='20' r='15' fill='none' stroke='%23FFD700' stroke-width='1' stroke-opacity='0.05'/%3E%3C/svg%3E");
  background-position: center;
  opacity: 0.6;
  animation: headerBgMove 20s linear infinite;
}

@keyframes bgShine {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
}

@keyframes headerBgMove {
  0% { 
    background-position: 0% 0%, 0% 0%;
    transform: scale(1);
  }
  50% {
    background-position: 50px 50px, 25px 25px;
    transform: scale(1.05);
  }
  100% { 
    background-position: 100px 100px, 50px 50px;
    transform: scale(1);
  }
}

.header-content {
  max-width: 100%;
  margin: 0 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.header-content h1 {
  margin: 0;
  font-size: 20px;
  color: #fff;
  font-weight: 500;
}

.header-fullscreen-btn {
  position: absolute;
  right: 24px;
  top: 50%;
  transform: translateY(-50%);
  width: 32px !important;
  height: 32px !important;
  border-radius: 4px !important;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent !important;
  transition: all 0.3s ease;
  color: #fff !important;
  border: 1px solid rgba(255, 255, 255, 0.5) !important;
  cursor: pointer;
  z-index: 1000;
}

.header-fullscreen-btn:hover {
  background: rgba(255, 255, 255, 0.1) !important;
  border-color: #fff !important;
}

.header-fullscreen-btn :deep(.anticon) {
  font-size: 18px;
  color: #fff !important;
}

.company-name {
  color: #FFD700;
  font-weight: 600;
  position: relative;
  padding: 0 12px;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
  letter-spacing: 1px;
}

.company-name::before,
.company-name::after {
  content: '✦';
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  color: #FFD700;
  font-size: 18px;
  opacity: 0.9;
  text-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
}

.company-name::before {
  left: -12px;
}

.company-name::after {
  right: -12px;
}

.title-divider {
  color: rgba(255, 255, 255, 0.8);
  font-weight: normal;
  font-size: 20px;
  transform: scale(0.8);
}

.event-name {
  color: #fff;
  font-weight: 500;
  background: linear-gradient(90deg, 
    rgba(255, 215, 0, 0.1) 0%,
    rgba(255, 215, 0, 0.2) 50%,
    rgba(255, 215, 0, 0.1) 100%
  );
  padding: 8px 24px;
  border-radius: 24px;
  position: relative;
  overflow: hidden;
  box-shadow: 0 0 20px rgba(255, 215, 0, 0.2);
  backdrop-filter: blur(4px);
  letter-spacing: 2px;
  border: 1px solid rgba(255, 215, 0, 0.2);
}

.event-name::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: linear-gradient(
    to right,
    rgba(255, 215, 0, 0) 0%,
    rgba(255, 215, 0, 0.3) 50%,
    rgba(255, 215, 0, 0) 100%
  );
  transform: rotate(45deg);
  animation: shine 4s cubic-bezier(0.4, 0, 0.2, 1) infinite;
}

@keyframes shine {
  0% { transform: translateX(-100%) rotate(45deg); }
  100% { transform: translateX(100%) rotate(45deg); }
}

.content {
  flex: 1;
  background: transparent;
  padding: 24px;
  position: relative;
  z-index: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.footer {
  flex: none;
  text-align: center;
  color: rgba(0, 0, 0, 0.45);
  padding: 20px 0;
  background: #fff;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  position: relative;
  z-index: 1;
}

.footer-divider {
  color: #d9d9d9;
}

/* 卡片样式优化 */
:deep(.ant-card) {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  border-radius: 12px;
  border: none;
}

:deep(.ant-card-head) {
  border-bottom: 1px solid #f0f0f0;
  padding: 0 24px;
  font-size: 18px;
  font-weight: 600;
}

:deep(.ant-card-head-title) {
  text-align: center;
  color: #262626;
}

/* 调整布局容器样式 */
:deep(.ant-layout) {
  background: transparent;
  min-height: 100vh;
  width: 100%;
  overflow-x: hidden;
}

:deep(.ant-layout-content) {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
</style>
