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
            <div ref="tagCloudContainer" class="tag-cloud-container"></div>
            <div class="controls">
              <a-button 
                type="primary" 
                size="large"
                :disabled="isDrawing"
                @click="startDraw"
              >
                开始抽奖
              </a-button>
              <a-button 
                type="primary" 
                danger
                size="large"
                :disabled="!isDrawing"
                @click="stopDraw"
              >
                停止抽奖
              </a-button>
            </div>
            <!-- 中奖结果 -->
            <a-modal
              v-model:visible="showResult"
              title="抽奖结果"
              :footer="null"
              :maskClosable="false"
              centered
            >
              <div class="result-content">
                <div class="winner-info">
                  🎉 恭喜 <span class="winner-name">{{ winner }}</span> 🎉
                </div>
              </div>
            </a-modal>
          </div>
        </a-card>
      </a-col>
    </a-row>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import TagCloud from 'TagCloud'

const router = useRouter()
const tagCloudContainer = ref(null)
let tagCloudInstance = null
const isDrawing = ref(false)
const showResult = ref(false)
const winner = ref('')

// 模拟参与者数据
const participants = [
  '张三', '李四', '王五', '赵六', '钱七', '孙八', 
  '周九', '吴十', '郑十一', '王十二', '李十三', 
  '刘十四', '陈十五', '杨十六', '黄十七', '赵十八'
]

const goToLuckyDraw = () => {
  router.push('/')
}

const initTagCloud = () => {
  const options = {
    radius: 200,
    maxSpeed: 'normal',
    initSpeed: 'normal',
    direction: 135,
    keep: true
  }
  
  tagCloudInstance = TagCloud(tagCloudContainer.value, participants, options)
}

const startDraw = () => {
  isDrawing.value = true
  if (tagCloudInstance) {
    tagCloudInstance.update({ maxSpeed: 'fast' })
  }
}

const stopDraw = () => {
  isDrawing.value = false
  if (tagCloudInstance) {
    tagCloudInstance.update({ maxSpeed: 'slow' })
    // 随机选择获奖者
    const randomIndex = Math.floor(Math.random() * participants.length)
    winner.value = participants[randomIndex]
    showResult.value = true
  }
}

onMounted(() => {
  initTagCloud()
})

onBeforeUnmount(() => {
  if (tagCloudInstance) {
    tagCloudInstance.destroy()
  }
})
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
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.tag-cloud-container {
  width: 100%;
  height: 400px;
  position: relative;
}

:deep(.tagcloud) {
  font-family: 'Inter', sans-serif;
  font-weight: 600;
  letter-spacing: 0.0625em;
  font-size: 1.1em;
}

:deep(.tagcloud--item) {
  color: #ff4d4f;
  padding: 2px 4px;
  background-color: transparent;
  border-radius: 3px;
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.3s ease;
}

:deep(.tagcloud--item:hover) {
  background-color: rgba(255, 77, 79, 0.1);
  border-color: #ff4d4f;
}

.controls {
  margin-top: 24px;
  display: flex;
  gap: 16px;
}

.result-content {
  text-align: center;
  padding: 24px;
}

.winner-info {
  font-size: 24px;
  color: #ff4d4f;
  font-weight: 500;
}

.winner-name {
  font-size: 32px;
  font-weight: 600;
  color: #ff4d4f;
  margin: 0 8px;
}

:deep(.ant-card-body) {
  flex: 1;
  overflow: auto;
  padding: 16px;
}
</style>
