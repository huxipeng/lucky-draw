<template>
  <div class="lucky-draw">
    <a-row :gutter="[16, 16]" class="draw-container">
      <!-- 左侧抽奖区域 -->
      <a-col :span="16">
        <a-card class="draw-area">
          <template #title>
            <div class="card-title-wrapper">
              <span class="title-text">幸运抽奖</span>
              <span class="remaining-count">
                待抽奖 <span class="count-number">{{ store.availableParticipants.length }}</span> 人
              </span>
            </div>
          </template>

          <!-- 抽奖主区域 -->
          <div class="draw-main">
            <!-- 抽人阶段 -->
            <div v-if="currentStage === 'PERSON'" class="draw-section">
              <div class="candidates-grid">
                <div
                  v-for="participant in store.availableParticipants"
                  :key="participant.id"
                  class="candidate-item"
                  :class="{ 
                    'active': !isDrawing && participant.name === currentRollingName,
                    'highlight': isDrawing && participant.name === currentRollingName 
                  }"
                >
                  {{ participant.name }}
                </div>
              </div>
            </div>

            <!-- 礼包抽取阶段 -->
            <div v-if="currentStage === 'GIFT'" class="draw-section">
              <div class="gift-info">
                <div class="winner-name">
                  恭喜 {{ currentPerson?.name }}
                </div>
                <div class="rolling-gift" v-if="isDrawing">
                  {{ currentRollingGift }}
                </div>
                <template v-else>
                  <!-- 显示最终结果 -->
                  <div v-if="isCompleted" class="result-summary">
                    <div class="gift-content">
                      <div class="reveal-title">🎉 抽中年会奖品是：</div>
                      <div class="reward-result">
                        <div class="reward-item">{{ rewardResult?.name }}</div>
                      </div>
                    </div>
                  </div>
                  <!-- 显示惩罚任务 -->
                  <div v-if="punishmentResults.length > 0" class="hidden-gift-reveal">
                    <div class="reveal-title" v-if="!isCompleted">
                      🎉 恭喜抽中趣味任务！
                    </div>
                    <div class="tasks-preview">
                      <div class="list-title">任务列表</div>
                      <div class="tasks-grid">
                        <div v-for="(task, index) in punishmentResults" :key="index" class="task-item">
                          {{ task.name }}
                        </div>
                      </div>
                    </div>
                  </div>
                </template>
              </div>
            </div>
          </div>

          <!-- 控制按钮区域 -->
          <div class="control-area">
            <div class="action-buttons">
              <template v-if="currentStage === 'PERSON'">
                <a-button
                  type="primary"
                  :disabled="!canDrawPerson"
                  @click="handleDrawPerson"
                  :loading="isDrawing"
                  size="large"
                >
                  {{ isDrawing ? '停止' : '开始抽取' }}
                </a-button>
              </template>
              <template v-else-if="currentStage === 'GIFT'">
                <a-button
                  type="primary"
                  @click="isDrawing ? handleDrawGift() : (isCompleted ? handleReset() : handleDrawGift())"
                  :loading="isDrawing"
                  size="large"
                >
                  {{ drawButtonText }}
                </a-button>
              </template>
            </div>
          </div>
        </a-card>
      </a-col>

      <!-- 右侧中奖记录 -->
      <a-col :span="8">
        <a-card title="中奖记录" class="winners-area">
          <a-table 
            :dataSource="store.winners" 
            :columns="columns" 
            :pagination="{ pageSize: 10 }"
            size="middle"
          />
        </a-card>
      </a-col>
    </a-row>
  </div>
</template>

<script setup>
import { ref, computed, onUnmounted, onMounted } from 'vue'
import { useLuckyDrawStore } from '@/stores/luckyDraw'
import { message } from 'ant-design-vue'
import { participants } from '@/config/participants'

const store = useLuckyDrawStore()

// 定时器变量
let rollingTimer = null
let autoStopTimer = null
let highlightTimer = null

// 组件内部状态
const isDrawing = ref(false)
const currentStage = ref('PERSON')
const currentPerson = ref(null)
const currentRollingName = ref('')
const currentRollingGift = ref('')
const punishmentResults = ref([])
const rewardResult = ref(null)
const isCompleted = ref(false)

// 计算属性
const canDrawPerson = computed(() => store.availableParticipants.length > 0)
const drawButtonText = computed(() => {
  if (isDrawing.value) return '停止'
  if (isCompleted.value) {
    if (store.availablePrizes.length === 0) return '奖池已经被抢光了'
    return '抬走，有请下一位'
  }
  if (punishmentResults.value.length > 0) return '继续抽取'
  return '抽取礼品'
})

// 表格列定义
const columns = [
  {
    title: '姓名',
    dataIndex: ['winner', 'name'],
    key: 'name',
    align: 'center'
  },
  {
    title: '奖励',
    dataIndex: ['prize', 'name'],
    key: 'prize',
    align: 'center'
  },
  {
    title: '时间',
    dataIndex: 'timestamp',
    key: 'timestamp',
    align: 'center',
    customRender: ({ text }) => new Date(text).toLocaleString()
  }
]

// 抽奖方法
const handleDrawPerson = () => {
  if (!isDrawing.value) {
    // 开始抽人
    isDrawing.value = true
    startRollingName()
  } else {
    // 停止抽人
    isDrawing.value = false
    stopRolling()
    // 选择人员
    const person = store.drawPerson()
    currentPerson.value = person
    currentStage.value = 'GIFT'
    currentRollingName.value = ''
    message.success(`已抽中: ${person.name}`)
  }
}

const handleDrawGift = () => {
  // 检查是否还有可用奖品
  if (!isDrawing.value && store.availablePrizes.length === 0) {
    message.warning('奖池已经被抢光了')
    return
  }

  if (!isDrawing.value) {
    isDrawing.value = true
    startRollingGift()
  } else {
    isDrawing.value = false
    stopRolling()
    const result = store.drawGift(currentPerson.value)
    punishmentResults.value = result.punishmentResults
    rewardResult.value = result.reward
    currentRollingGift.value = ''
    isCompleted.value = true
  }
}

const handleReset = () => {
  currentPerson.value = null
  currentStage.value = 'PERSON'
  currentRollingName.value = ''
  currentRollingGift.value = ''
  punishmentResults.value = []
  rewardResult.value = null
  isCompleted.value = false
  isDrawing.value = false
}

// 滚动效果
const startRollingName = () => {
  let lastIndex = -1
  rollingTimer = setInterval(() => {
    const participants = store.availableParticipants
    let randomIndex
    do {
      randomIndex = Math.floor(Math.random() * participants.length)
    } while (randomIndex === lastIndex && participants.length > 1)
    
    lastIndex = randomIndex
    currentRollingName.value = participants[randomIndex].name
  }, 50)

  const randomDuration = 3000 + Math.random() * 2000
  autoStopTimer = setTimeout(() => {
    if (isDrawing.value) {
      handleDrawPerson()
    }
  }, randomDuration)
}

const startRollingGift = () => {
  const gifts = store.isFirstDraw
    ? ['神秘礼包', '惊喜礼包', '隐藏礼包', '趣味礼包', '幸运礼包']
    : ['神秘大奖', '幸运好礼', '惊喜礼品', '特别奖励', '幸运之星']
  
  let lastIndex = -1
  rollingTimer = setInterval(() => {
    let randomIndex
    do {
      randomIndex = Math.floor(Math.random() * gifts.length)
    } while (randomIndex === lastIndex && gifts.length > 1)
    
    lastIndex = randomIndex
    currentRollingGift.value = gifts[randomIndex]
  }, 100)

  const randomDuration = 3000 + Math.random() * 2000
  autoStopTimer = setTimeout(() => {
    if (isDrawing.value) {
      handleDrawGift()
    }
  }, randomDuration)
}

const stopRolling = () => {
  if (rollingTimer) {
    clearInterval(rollingTimer)
    rollingTimer = null
  }
  if (autoStopTimer) {
    clearTimeout(autoStopTimer)
    autoStopTimer = null
  }
}

// 组件挂载时导入参与者名单
onMounted(() => {
  store.importParticipants(participants)
})

// 组件销毁时清理定时器
onUnmounted(() => {
  stopRolling()
  if (highlightTimer) {
    clearInterval(highlightTimer)
  }
})
</script>

<style scoped>
.lucky-draw {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.draw-container {
  height: 100%;
  flex: 1;
}

.draw-area, .winners-area {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.rolling-box {
  flex: 1;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 24px;
  margin-bottom: 24px;
  background: linear-gradient(135deg, #fff5f5 0%, #fff1f0 100%);
  border-radius: 16px;
  min-height: 400px;
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(255, 77, 79, 0.1);
  padding: 20px;
}

.candidates-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(90px, 1fr));
  gap: 10px;
  padding: 16px;
  width: 100%;
  max-height: 380px;
  overflow-y: auto;
  position: relative;
}

.candidate-item {
  padding: 8px 6px;
  text-align: center;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 6px;
  font-size: 15px;
  color: #666;
  transition: all 0.15s ease;
  border: 1px solid rgba(255, 77, 79, 0.1);
  position: relative;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  cursor: default;
}

.candidate-item.highlight {
  color: #fff;
  background: linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%);
  transform: scale(1.08);
  box-shadow: 0 4px 12px rgba(255, 77, 79, 0.2);
  z-index: 1;
  font-weight: bold;
}

.candidate-item.active {
  color: #fff;
  background: linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%);
  transform: scale(1.08);
  box-shadow: 0 4px 12px rgba(255, 77, 79, 0.2);
  z-index: 1;
  font-weight: bold;
}

.candidate-item.highlight::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(circle at center, rgba(255, 255, 255, 0.2) 0%, transparent 70%);
  animation: glowPulse 0.5s ease-in-out infinite;
}

@keyframes glowPulse {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 0.8; }
}

.selected-info {
  flex: 0 0 200px;
  text-align: center;
  background: rgba(255, 255, 255, 0.9);
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(255, 77, 79, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 77, 79, 0.1);
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: 200px;
  animation: slideIn 0.5s ease-out;
}

.selected-person {
  font-size: 36px;
  font-weight: bold;
  background: linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 12px;
  text-shadow: 0 2px 4px rgba(255, 77, 79, 0.1);
}

.selected-prize {
  font-size: 28px;
  background: linear-gradient(135deg, #ff7875 0%, #ffa39e 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 2px 4px rgba(255, 77, 79, 0.1);
}

:deep(.ant-card-body) {
  overflow: visible;
}

.hint-text {
  font-size: 24px;
  color: rgba(0, 0, 0, 0.45);
  text-align: center;
  padding: 0 24px;
  z-index: 1;
}

.draw-info {
  margin-top: auto;
}

.info-row {
  display: flex;
  justify-content: space-around;
  color: rgba(0, 0, 0, 0.65);
  margin-bottom: 20px;
  font-size: 15px;
  background: rgba(255, 255, 255, 0.9);
  padding: 16px;
  border-radius: 8px;
  backdrop-filter: blur(4px);
  border: 1px solid rgba(255, 77, 79, 0.1);
  box-shadow: 0 2px 8px rgba(255, 77, 79, 0.05);
}

.action-buttons {
  display: flex;
  gap: 20px;
  justify-content: center;
  align-items: center;
  padding: 12px 0;
}

.action-buttons :deep(.ant-btn) {
  min-width: 140px;
  height: 46px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  letter-spacing: 1px;
  transition: all 0.3s ease;
}

.action-buttons :deep(.ant-btn-primary) {
  background: linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%);
  border: none;
  box-shadow: 0 4px 15px rgba(255, 77, 79, 0.2);
}

.action-buttons :deep(.ant-btn-primary:hover) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(255, 77, 79, 0.3);
}

.action-buttons :deep(.ant-btn-primary:active) {
  transform: translateY(0);
}

.winners-area :deep(.ant-table) {
  background: transparent;
}

.winners-area :deep(.ant-table-thead > tr > th) {
  background: #fafafa;
  text-align: center;
  font-weight: 500;
}

.winners-area :deep(.ant-table-tbody > tr > td) {
  transition: background 0.3s;
}

.winners-area :deep(.ant-table-tbody > tr:hover > td) {
  background: #e6f7ff;
}

:deep(.ant-card) {
  height: 100%;
  display: flex;
  flex-direction: column;
}

:deep(.ant-card-body) {
  flex: 1;
  overflow: auto;
  padding: 16px;
}

:deep(.ant-table-wrapper) {
  height: 100%;
}

:deep(.ant-spin-nested-loading) {
  height: 100%;
}

:deep(.ant-spin-container) {
  height: 100%;
  display: flex;
  flex-direction: column;
}

:deep(.ant-table) {
  flex: 1;
  overflow: auto;
}

.draw-area {
  background: #fff;
  border: none;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
}

:deep(.ant-card-head) {
  background: #fff;
  border-bottom: 1px solid #f0f0f0;
}

:deep(.ant-card-head-title) {
  color: rgba(0, 0, 0, 0.85);
  font-size: 20px;
  letter-spacing: 2px;
  font-weight: 600;
}

/* 添加滚动条样式 */
.candidates-grid::-webkit-scrollbar {
  width: 6px;
}

.candidates-grid::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.05);
  border-radius: 3px;
}

.candidates-grid::-webkit-scrollbar-thumb {
  background: rgba(255, 77, 79, 0.3);
  border-radius: 3px;
}

.candidates-grid::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 77, 79, 0.5);
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
}

.draw-section {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.rolling-display {
  text-align: center;
  padding: 40px;
}

.rolling-name {
  font-size: 48px;
  font-weight: bold;
  background: linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: textGlow 2s ease-in-out infinite;
}

.pools-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-top: 30px;
}

.pool-item {
  width: 160px;
  height: 160px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 12px;
  font-size: 24px;
  color: #666;
  transition: all 0.3s ease;
  border: 2px solid rgba(255, 77, 79, 0.1);
  cursor: pointer;
}

.pool-item.selected {
  background: linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%);
  color: #fff;
  transform: scale(1.05);
  box-shadow: 0 4px 15px rgba(255, 77, 79, 0.2);
}

.pool-item.rolling {
  animation: poolPulse 1s ease-in-out infinite;
}

@keyframes poolPulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

.punishment-info, .reward-info {
  text-align: center;
  margin-bottom: 30px;
}

.current-pool, .pool-name {
  font-size: 24px;
  color: #666;
  margin-bottom: 20px;
}

.rolling-punishment, .rolling-reward {
  font-size: 36px;
  font-weight: bold;
  background: linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: textGlow 2s ease-in-out infinite;
}

.results-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 20px;
}

.result-item {
  padding: 12px 24px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 8px;
  font-size: 18px;
  color: #666;
  box-shadow: 0 2px 8px rgba(255, 77, 79, 0.1);
}

.result-summary {
  margin-top: 30px;
  padding: 30px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(255, 77, 79, 0.1);
  animation: fadeInUp 0.5s ease-out;
}

.winner-name {
  font-size: 48px;
  font-weight: bold;
  background: linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 24px;
}

.list-title {
  font-size: 18px;
  color: #666;
  margin-bottom: 12px;
}

.punishment-item, .reward-item {
  font-size: 24px;
  color: #ff4d4f;
  margin-bottom: 8px;
}

.control-area {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

/* 更新现有样式 */
.info-row {
  margin-bottom: 20px;
}

.action-buttons {
  display: flex;
  gap: 20px;
  justify-content: center;
}

.action-buttons :deep(.ant-btn) {
  min-width: 160px;
}

.gift-info {
  text-align: center;
  padding: 40px;
}

.rolling-gift {
  font-size: 48px;
  font-weight: bold;
  background: linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: textGlow 2s ease-in-out infinite;
  margin-top: 30px;
}

.tasks-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 32px;
}

.task-item {
  background: rgba(255, 77, 79, 0.05);
  border-radius: 12px;
  padding: 16px;
  font-size: 20px;
  color: #ff4d4f;
  transition: all 0.3s ease;
}

.task-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 77, 79, 0.1);
}

.stage-progress {
  font-size: 24px;
  color: #666;
  margin: 20px 0;
  padding: 10px 20px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 20px;
  display: inline-block;
}

.tasks-preview {
  margin-top: 20px;
  padding: 20px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(255, 77, 79, 0.1);
}

.rolling-gift {
  font-size: 48px;
  font-weight: bold;
  background: linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: textGlow 2s ease-in-out infinite;
  margin-top: 30px;
  min-height: 72px;
}

.hidden-gift-reveal {
  margin-top: 30px;
  animation: fadeInUp 0.5s ease-out;
}

.reveal-title {
  font-size: 32px;
  font-weight: bold;
  color: #ff4d4f;
  margin-bottom: 20px;
  text-shadow: 0 2px 4px rgba(255, 77, 79, 0.2);
  animation: pulse 2s infinite;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

.tasks-preview {
  margin-top: 20px;
  padding: 20px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(255, 77, 79, 0.1);
}

.tasks-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.task-item {
  background: rgba(255, 77, 79, 0.05);
  border-radius: 12px;
  padding: 16px;
  font-size: 20px;
  color: #ff4d4f;
  transition: all 0.3s ease;
  animation: fadeIn 0.5s ease-out;
}

.task-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 77, 79, 0.1);
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.gift-content {
  text-align: center;
}

.reward-result {
  margin-top: 20px;
  padding: 20px;
  background: rgba(255, 77, 79, 0.05);
  border-radius: 12px;
}

.reward-item {
  font-size: 32px;
  font-weight: bold;
  background: linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin: 10px 0;
  animation: fadeIn 0.5s ease-out;
}

.fullscreen-btn {
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 10;
}

.fullscreen-btn :deep(.ant-btn) {
  width: 40px;
  height: 40px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 77, 79, 0.1);
}

.fullscreen-btn :deep(.ant-btn:hover) {
  background: #fff;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 77, 79, 0.2);
}

.fullscreen-btn :deep(.anticon) {
  font-size: 20px;
  color: #ff4d4f;
}

.card-title-wrapper {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.title-text {
  font-size: 20px;
  color: rgba(0, 0, 0, 0.85);
  font-weight: 500;
}

.remaining-count {
  font-size: 14px;
  color: rgba(0, 0, 0, 0.45);
}

.count-number {
  font-size: 16px;
  color: #ff4d4f;
  font-weight: 600;
  margin: 0 4px;
}

.header-fullscreen-btn {
  position: absolute;
  right: 16px;
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
}

.header-fullscreen-btn:hover {
  background: rgba(255, 255, 255, 0.1) !important;
}

.header-fullscreen-btn :deep(.anticon) {
  font-size: 18px;
  color: #fff;
}

.page-header {
  padding: 8px 24px;
  background: #1f1f1f;
  margin-bottom: 16px;
  position: relative;
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
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
  right: 16px;
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
}

.header-fullscreen-btn:hover {
  background: rgba(255, 255, 255, 0.1) !important;
}

.header-fullscreen-btn :deep(.anticon) {
  font-size: 18px;
  color: #fff;
}
</style> 