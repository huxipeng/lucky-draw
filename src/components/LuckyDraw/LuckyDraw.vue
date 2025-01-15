<template>
  <div class="lucky-draw">
    <a-row :gutter="[16, 16]" class="draw-container">
      <!-- 左侧抽奖区域 -->
      <a-col :span="16">
        <a-card title="抽奖区域" class="draw-area">
          <div class="rolling-box" ref="rollingBox">
            <template v-if="!store.currentPerson">
              <div class="rolling-item" v-if="currentRollingName">
                {{ currentRollingName }}
              </div>
              <div v-else class="hint-text">
                点击开始按钮抽取幸运观众
              </div>
            </template>
            <template v-else>
              <div class="selected-person">
                {{ store.currentPerson.name }}
              </div>
              <div class="rolling-prize" v-if="currentRollingPrize">
                {{ currentRollingPrize }}
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
  rollingTimer = setInterval(() => {
    const participants = store.availableParticipants
    const randomIndex = Math.floor(Math.random() * participants.length)
    currentRollingName.value = participants[randomIndex].name
  }, 50)

  autoStopTimer = setTimeout(() => {
    if (isDrawing.value) {
      toggleDrawPerson()
    }
  }, 5000)
}

const startRollingPrize = () => {
  rollingTimer = setInterval(() => {
    const prizes = store.availablePrizes
    const randomIndex = Math.floor(Math.random() * prizes.length)
    currentRollingPrize.value = prizes[randomIndex].name
  }, 50)

  autoStopTimer = setTimeout(() => {
    if (isDrawing.value) {
      toggleDrawPrize()
    }
  }, 5000)
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
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin-bottom: 24px;
  background: linear-gradient(135deg, #e6f7ff 0%, #f0f5ff 100%);
  border-radius: 12px;
  gap: 16px;
  min-height: 200px;
  box-shadow: inset 0 2px 4px 0 rgba(0, 0, 0, 0.05);
  position: relative;
  overflow: hidden;
}

.rolling-box::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(circle at center, transparent 0%, rgba(24, 144, 255, 0.1) 100%);
  pointer-events: none;
}

.rolling-item, .selected-person {
  font-size: 48px;
  font-weight: bold;
  background: linear-gradient(45deg, #1890ff, #69c0ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
}

.rolling-prize {
  font-size: 36px;
  font-weight: bold;
  background: linear-gradient(45deg, #f5222d, #ff7875);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
}

.hint-text {
  font-size: 20px;
  color: rgba(0, 0, 0, 0.45);
  text-align: center;
  padding: 0 24px;
}

.draw-info {
  margin-top: auto;
}

.info-row {
  display: flex;
  justify-content: space-around;
  color: rgba(0, 0, 0, 0.65);
  margin-bottom: 20px;
  font-size: 14px;
  background: #fafafa;
  padding: 12px;
  border-radius: 6px;
}

.action-buttons {
  display: flex;
  gap: 16px;
  justify-content: center;
  align-items: center;
  padding: 8px 0;
}

.action-buttons :deep(.ant-btn) {
  min-width: 120px;
  height: 40px;
  border-radius: 6px;
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
</style> 