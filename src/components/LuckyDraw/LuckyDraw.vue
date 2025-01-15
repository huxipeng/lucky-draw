<template>
  <div class="lucky-draw">
    <a-row :gutter="[16, 16]" class="draw-container">
      <!-- 左侧抽奖区域 -->
      <a-col :span="16">
        <a-card title="抽奖区域" class="draw-area">
          <div class="rolling-box" ref="rollingBox">
            <div class="selected-info" v-if="store.currentPerson">
              <div class="selected-person">{{ store.currentPerson.name }}</div>
              <div class="selected-prize" v-if="currentRollingPrize">
                {{ currentRollingPrize }}
              </div>
            </div>
            <template v-if="!store.currentPerson">
              <div class="candidates-grid">
                <div
                  v-for="participant in store.availableParticipants"
                  :key="participant.id"
                  class="candidate-item"
                  :class="{ active: participant.name === currentRollingName }"
                >
                  {{ participant.name }}
                </div>
              </div>
            </template>
          </div>
          <div class="draw-info">
            <div class="info-row">
              <span class="participant-info">
                待抽奖人数: {{ store.availableParticipants.length }}
              </span>
              <span class="prize-info">
                剩余奖项: 
                <template v-for="prize in store.prizes" :key="prize.id">
                  {{ prize.name }}({{ prize.remaining }}) 
                </template>
              </span>
            </div>
            <div class="action-buttons">
              <template v-if="!store.currentPerson">
                <a-button
                  type="primary"
                  :disabled="!canDrawPerson"
                  @click="toggleDrawPerson"
                  :loading="isDrawing"
                  size="large"
                >
                  {{ isDrawing ? '停止' : '开始抽人' }}
                </a-button>
              </template>
              <template v-else>
                <a-button
                  type="primary"
                  :disabled="!canDrawPrize"
                  @click="toggleDrawPrize"
                  :loading="isDrawing"
                  size="large"
                >
                  {{ isDrawing ? '停止' : '开始抽奖' }}
                </a-button>
              </template>
              <a-button @click="resetDraw" :disabled="isDrawing" size="large">
                重置
              </a-button>
            </div>
          </div>
        </a-card>
      </a-col>

      <!-- 右侧中奖记录 -->
      <a-col :span="8">
        <a-card title="中奖记录" class="winners-area">
          <a-table 
            :dataSource="winners" 
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

// 状态
const currentRollingName = ref('')
const currentRollingPrize = ref('')
let rollingTimer = null
let autoStopTimer = null

// 计算属性
const canDrawPerson = computed(() => store.availableParticipants.length > 0)
const canDrawPrize = computed(() => store.availablePrizes.length > 0)
const isDrawing = computed(() => store.isDrawing)
const winners = computed(() => store.winners)

// 表格列定义
const columns = [
  {
    title: '姓名',
    dataIndex: ['winner', 'name'],
    key: 'name',
    align: 'center'
  },
  {
    title: '奖项',
    dataIndex: ['prize', 'name'],
    key: 'prize',
    align: 'center'
  },
  {
    title: '中奖时间',
    dataIndex: 'timestamp',
    key: 'timestamp',
    align: 'center',
    customRender: ({ text }) => new Date(text).toLocaleString(),
  },
]

// 方法
const startRollingName = () => {
  let lastIndex = -1;
  rollingTimer = setInterval(() => {
    const participants = store.availableParticipants;
    let randomIndex;
    // 确保不会连续选中同一个人
    do {
      randomIndex = Math.floor(Math.random() * participants.length);
    } while (randomIndex === lastIndex && participants.length > 1);
    
    lastIndex = randomIndex;
    currentRollingName.value = participants[randomIndex].name;
  }, 100); // 稍微降低速度，让动画更清晰

  // 随机 3-5 秒后停止
  const randomDuration = 3000 + Math.random() * 2000;
  autoStopTimer = setTimeout(() => {
    if (isDrawing.value) {
      toggleDrawPerson();
    }
  }, randomDuration);
}

const startRollingPrize = () => {
  let lastIndex = -1;
  rollingTimer = setInterval(() => {
    const prizes = store.availablePrizes;
    let randomIndex;
    // 确保不会连续选中同一个奖项
    do {
      randomIndex = Math.floor(Math.random() * prizes.length);
    } while (randomIndex === lastIndex && prizes.length > 1);
    
    lastIndex = randomIndex;
    currentRollingPrize.value = prizes[randomIndex].name;
  }, 100);

  // 随机 3-5 秒后停止
  const randomDuration = 3000 + Math.random() * 2000;
  autoStopTimer = setTimeout(() => {
    if (isDrawing.value) {
      toggleDrawPrize();
    }
  }, randomDuration);
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

const toggleDrawPerson = () => {
  if (!isDrawing.value) {
    // 开始抽人
    store.startDraw()
    startRollingName()
  } else {
    // 停止抽人
    store.stopDraw()
    stopRolling()
    // 选择人员
    const participants = store.availableParticipants
    const person = participants[Math.floor(Math.random() * participants.length)]
    store.setCurrentPerson(person)
    currentRollingName.value = ''
    message.success(`已抽中: ${person.name}`)
  }
}

const toggleDrawPrize = () => {
  if (!isDrawing.value) {
    // 开始抽奖
    store.startDraw()
    startRollingPrize()
  } else {
    // 停止抽奖
    store.stopDraw()
    stopRolling()
    // 选择奖项
    const prizes = store.availablePrizes
    const prize = prizes[Math.floor(Math.random() * prizes.length)]
    store.addWinner(prize)
    currentRollingPrize.value = ''
    message.success(`恭喜 ${store.currentPerson.name} 获得 ${prize.name}！`)
  }
}

const resetDraw = () => {
  store.reset()
  currentRollingName.value = ''
  currentRollingPrize.value = ''
  message.success('抽奖已重置')
}

// 组件挂载时导入参与者名单
onMounted(() => {
  store.importParticipants(participants)
})

// 组件销毁时清理定时器
onUnmounted(() => {
  stopRolling()
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
  transition: all 0.3s ease;
  border: 1px solid rgba(255, 77, 79, 0.1);
  position: relative;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.candidate-item.active {
  color: #fff;
  background: linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%);
  transform: scale(1.08);
  box-shadow: 0 4px 12px rgba(255, 77, 79, 0.2);
  z-index: 1;
  font-weight: bold;
}

.candidate-item.active::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(circle at center, rgba(255, 255, 255, 0.2) 0%, transparent 70%);
  animation: glowPulse 1s ease-in-out infinite;
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
</style> 