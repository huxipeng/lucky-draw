<template>
  <div class="spec-draw">
    <a-row :gutter="[16, 16]" class="draw-container">
      <a-col :span="24">
        <a-card class="draw-area">
          <template #title>
            <div class="card-title-wrapper">
              <div class="title-section">
                <span class="title-text">年终大奖</span>
                <a-button 
                  type="link" 
                  class="lucky-draw-btn"
                  @click="goToLuckyDraw"
                >
                  幸运抽奖
                </a-button>
              </div>
              <div class="title-actions">
                <a-button 
                  type="text" 
                  @click="goToLuckyDraw"
                >
                  返回
                </a-button>
              </div>
            </div>
          </template>

          <!-- 抽奖主区域 -->
          <div class="draw-main">
            <div class="coming-soon">
              年终大奖抽奖即将推出...
            </div>
          </div>
        </a-card>
      </a-col>
    </a-row>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const goToLuckyDraw = () => {
  router.push('/')
}
</script>

<style scoped>
.spec-draw {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.draw-container {
  height: 100%;
  flex: 1;
}

.draw-area {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #fff;
  border: none;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
}

.card-title-wrapper {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.title-section {
  display: flex;
  align-items: center;
  gap: 16px;
}

.title-text {
  font-size: 20px;
  color: rgba(0, 0, 0, 0.85);
  font-weight: 500;
}

.lucky-draw-btn {
  font-size: 16px;
  font-weight: 500;
  color: #ff4d4f;
  padding: 4px 12px;
  border-radius: 4px;
  transition: all 0.3s ease;
}

.lucky-draw-btn:hover {
  background: rgba(255, 77, 79, 0.1);
}

.draw-main {
  min-height: 400px;
  background: linear-gradient(135deg, #fff5f5 0%, #fff1f0 100%);
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 24px;
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(255, 77, 79, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
}

.coming-soon {
  font-size: 24px;
  color: #ff4d4f;
  font-weight: 500;
}

:deep(.ant-card-body) {
  flex: 1;
  overflow: auto;
  padding: 16px;
}
</style>
