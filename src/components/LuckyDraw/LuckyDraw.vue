<template>
  <div class="lucky-draw">
    <a-row :gutter="[16, 16]" class="draw-container">
      <!-- 左侧抽奖区域 -->
      <a-col :span="16">
        <a-card class="draw-area">
          <!-- 抽奖阶段指示器 -->
          <div class="stage-indicator">
            <div 
              v-for="(stage, key) in DRAW_STAGES" 
              :key="key"
              class="stage-item"
              :class="{
                'active': currentStage === stage,
                'completed': isStageCompleted(stage)
              }"
            >
              {{ getStageText(stage) }}
            </div>
          </div>

          <!-- 抽奖主区域 -->
          <div class="draw-main">
            <!-- 抽人阶段 -->
            <div v-if="currentStage === DRAW_STAGES.PERSON || currentStage === DRAW_STAGES.IDLE" class="draw-section">
              <div class="candidates-grid" v-if="!isDrawing">
                <div
                  v-for="participant in store.availableParticipants"
                  :key="participant.id"
                  class="candidate-item"
                  :class="{ active: participant.name === currentRollingName }"
                >
                  {{ participant.name }}
                </div>
              </div>
              <div v-else class="rolling-display">
                <div class="rolling-name">{{ currentRollingName || '准备开始' }}</div>
              </div>
            </div>

            <!-- 抽取惩罚池阶段 -->
            <div v-if="currentStage === DRAW_STAGES.PUNISHMENT_POOLS" class="draw-section">
              <div class="selected-person">
                恭喜 {{ store.currentPerson?.name }}
              </div>
              <div class="pools-grid">
                <div
                  v-for="pool in punishmentPools"
                  :key="pool.id"
                  class="pool-item"
                  :class="{ 
                    'selected': isPoolSelected(pool.id),
                    'rolling': isDrawing 
                  }"
                >
                  {{ pool.name }}
                </div>
              </div>
            </div>

            <!-- 抽取惩罚阶段 -->
            <div v-if="currentStage === DRAW_STAGES.PUNISHMENT" class="draw-section">
              <div class="punishment-info">
                <div class="current-pool">
                  当前惩罚池：{{ currentPunishmentPool?.name }}
                </div>
                <div class="rolling-punishment" v-if="isDrawing">
                  {{ currentRollingPunishment }}
                </div>
              </div>
              <div class="results-list">
                <div v-for="(result, index) in store.punishmentResults" :key="index" class="result-item">
                  {{ result.name }}
                </div>
              </div>
            </div>

            <!-- 抽取奖励阶段 -->
            <div v-if="currentStage === DRAW_STAGES.REWARD" class="draw-section">
              <div class="reward-info">
                <div class="pool-name">
                  奖励池：{{ store.currentRewardPool?.name }}
                </div>
                <div class="rolling-reward" v-if="isDrawing">
                  {{ currentRollingReward }}
                </div>
              </div>
            </div>

            <!-- 完成阶段 -->
            <div v-if="currentStage === DRAW_STAGES.COMPLETED" class="draw-section">
              <div class="result-summary">
                <div class="winner-name">
                  {{ store.currentPerson?.name }}
                </div>
                <div class="punishments-list" v-if="store.punishmentResults.length">
                  <div class="list-title">获得惩罚：</div>
                  <div v-for="(punishment, index) in store.punishmentResults" :key="index" class="punishment-item">
                    {{ punishment.name }}
                  </div>
                </div>
                <div class="reward-result">
                  <div class="list-title">获得奖励：</div>
                  <div class="reward-item">{{ store.rewardResult?.name }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- 控制按钮区域 -->
          <div class="control-area">
            <div class="info-row">
              <span class="participant-info">
                待抽奖人数: {{ store.availableParticipants.length }}
              </span>
              <span class="stage-info">
                当前阶段: {{ store.currentStageText }}
              </span>
            </div>
            <div class="action-buttons">
              <template v-if="currentStage === DRAW_STAGES.PERSON || currentStage === DRAW_STAGES.IDLE">
                <a-button
                  type="primary"
                  :disabled="!canDrawPerson"
                  @click="handleDrawPerson"
                  :loading="isDrawing"
                  size="large"
                >
                  {{ isDrawing ? '停止' : '开始抽人' }}
                </a-button>
              </template>
              <template v-else-if="currentStage === DRAW_STAGES.PUNISHMENT_POOLS">
                <a-button
                  type="primary"
                  @click="handleDrawPunishmentPools"
                  size="large"
                >
                  抽取惩罚池
                </a-button>
              </template>
              <template v-else-if="currentStage === DRAW_STAGES.PUNISHMENT">
                <a-button
                  type="primary"
                  @click="handleDrawPunishment"
                  :loading="isDrawing"
                  size="large"
                >
                  {{ isDrawing ? '停止' : '抽取惩罚' }}
                </a-button>
              </template>
              <template v-else-if="currentStage === DRAW_STAGES.REWARD">
                <a-button
                  type="primary"
                  @click="handleDrawReward"
                  :loading="isDrawing"
                  size="large"
                >
                  {{ isDrawing ? '停止' : '抽取奖励' }}
                </a-button>
              </template>
              <a-button 
                @click="handleReset" 
                :disabled="isDrawing || currentStage === DRAW_STAGES.IDLE"
                size="large"
              >
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
import { useLuckyDrawStore, DRAW_STAGES } from '@/stores/luckyDraw'
import { message } from 'ant-design-vue'
import { participants } from '@/config/participants'
import { punishmentPools } from '@/config/pools'

const store = useLuckyDrawStore()
const currentStage = computed(() => store.currentStage)

// 状态
const currentRollingName = ref('')
const currentRollingPunishment = ref('')
const currentRollingReward = ref('')
let rollingTimer = null
let autoStopTimer = null

// 计算属性
const canDrawPerson = computed(() => store.availableParticipants.length > 0)
const isDrawing = computed(() => store.isDrawing)

// 表格列定义
const columns = [
  {
    title: '姓名',
    dataIndex: ['winner', 'name'],
    key: 'name',
    align: 'center'
  },
  {
    title: '惩罚',
    dataIndex: 'punishments',
    key: 'punishments',
    align: 'center',
    customRender: ({ text }) => text.map(p => p.name).join('、') || '无'
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

// 阶段判断方法
const isStageCompleted = (stage) => {
  const stageOrder = Object.values(DRAW_STAGES)
  const currentIndex = stageOrder.indexOf(currentStage.value)
  const targetIndex = stageOrder.indexOf(stage)
  return targetIndex < currentIndex
}

const getStageText = (stage) => {
  const stageMap = {
    [DRAW_STAGES.IDLE]: '准备开始',
    [DRAW_STAGES.PERSON]: '抽取人员',
    [DRAW_STAGES.PUNISHMENT_POOLS]: '抽取惩罚池',
    [DRAW_STAGES.PUNISHMENT]: '抽取惩罚',
    [DRAW_STAGES.REWARD]: '抽取奖励',
    [DRAW_STAGES.COMPLETED]: '完成'
  }
  return stageMap[stage]
}

// 抽奖方法
const handleDrawPerson = () => {
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

const handleDrawPunishmentPools = () => {
  store.drawPunishmentPools()
  if (store.selectedPunishmentPools.length > 0) {
    message.success(`抽中 ${store.selectedPunishmentPools.length} 个惩罚池`)
  } else {
    message.success('本次无需执行惩罚')
  }
}

const handleDrawPunishment = () => {
  if (!isDrawing.value) {
    // 开始抽惩罚
    store.startDraw()
    startRollingPunishment()
  } else {
    // 停止抽惩罚
    store.stopDraw()
    stopRolling()
    // 从当前惩罚池中选择
    const pool = store.selectedPunishmentPools[store.punishmentResults.length]
    const punishment = pool.items[Math.floor(Math.random() * pool.items.length)]
    store.addPunishmentResult(punishment)
    currentRollingPunishment.value = ''
    message.success(`抽中惩罚: ${punishment.name}`)
  }
}

const handleDrawReward = () => {
  if (!isDrawing.value) {
    // 开始抽奖励
    store.startDraw()
    startRollingReward()
  } else {
    // 停止抽奖励
    store.stopDraw()
    stopRolling()
    // 从奖励池中选择
    const rewards = store.availablePrizes
    const reward = rewards[Math.floor(Math.random() * rewards.length)]
    store.addRewardResult(reward)
    currentRollingReward.value = ''
    message.success(`恭喜获得: ${reward.name}`)
  }
}

const handleReset = () => {
  store.resetCurrent()
  currentRollingName.value = ''
  currentRollingPunishment.value = ''
  currentRollingReward.value = ''
  message.success('已重置当前抽奖')
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
  }, 100)

  const randomDuration = 3000 + Math.random() * 2000
  autoStopTimer = setTimeout(() => {
    if (isDrawing.value) {
      handleDrawPerson()
    }
  }, randomDuration)
}

const startRollingPunishment = () => {
  const pool = store.selectedPunishmentPools[store.punishmentResults.length]
  let lastIndex = -1
  rollingTimer = setInterval(() => {
    let randomIndex
    do {
      randomIndex = Math.floor(Math.random() * pool.items.length)
    } while (randomIndex === lastIndex && pool.items.length > 1)
    
    lastIndex = randomIndex
    currentRollingPunishment.value = pool.items[randomIndex].name
  }, 100)

  const randomDuration = 3000 + Math.random() * 2000
  autoStopTimer = setTimeout(() => {
    if (isDrawing.value) {
      handleDrawPunishment()
    }
  }, randomDuration)
}

const startRollingReward = () => {
  let lastIndex = -1
  rollingTimer = setInterval(() => {
    const rewards = store.availablePrizes
    let randomIndex
    do {
      randomIndex = Math.floor(Math.random() * rewards.length)
    } while (randomIndex === lastIndex && rewards.length > 1)
    
    lastIndex = randomIndex
    currentRollingReward.value = rewards[randomIndex].name
  }, 100)

  const randomDuration = 3000 + Math.random() * 2000
  autoStopTimer = setTimeout(() => {
    if (isDrawing.value) {
      handleDrawReward()
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

// 惩罚池相关方法
const isPoolSelected = (poolId) => {
  return store.selectedPunishmentPools.some(pool => pool.id === poolId)
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

.stage-indicator {
  display: flex;
  justify-content: space-between;
  margin-bottom: 24px;
  padding: 0 20px;
  position: relative;
}

.stage-indicator::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 40px;
  right: 40px;
  height: 2px;
  background: #f0f0f0;
  z-index: 1;
}

.stage-item {
  position: relative;
  width: 120px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
  border: 2px solid #f0f0f0;
  border-radius: 18px;
  font-size: 14px;
  color: #999;
  z-index: 2;
  transition: all 0.3s ease;
}

.stage-item.active {
  background: linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%);
  border-color: #ff4d4f;
  color: #fff;
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(255, 77, 79, 0.2);
}

.stage-item.completed {
  background: #f6ffed;
  border-color: #52c41a;
  color: #52c41a;
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
  text-align: center;
  padding: 30px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(255, 77, 79, 0.1);
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
</style> 