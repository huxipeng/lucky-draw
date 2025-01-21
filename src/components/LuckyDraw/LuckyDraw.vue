<template>
  <div class="lucky-draw">
    <a-row :gutter="[16, 16]" class="draw-container">
      <!-- 左侧抽奖区域 -->
      <a-col :span="16">
        <a-card class="draw-area">
          <template #title>
            <div class="card-title-wrapper">
              <div class="title-section">
                <span class="title-text">幸运抽奖</span>
                <a-button 
                  type="link" 
                  class="spec-draw-btn"
                  @click="goToSpecDraw"
                >
                  年终大奖入口
                </a-button>
              </div>
              <div class="title-actions">
                <span class="remaining-count">
                  待抽奖 <span class="count-number">{{ store.availableParticipants.length }}</span> 人
                </span>
                <a-button 
                  type="text" 
                  danger
                  class="reset-button"
                  @click="showResetConfirm"
                >
                  重置抽奖
                </a-button>
              </div>
            </div>
          </template>

          <!-- 抽奖主区域 -->
          <div class="draw-main">
            <!-- 抽人阶段 -->
            <div v-if="currentStage === DRAW_STAGES.PERSON" class="draw-section">
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

            <!-- 奖品抽取阶段 -->
            <div v-else class="draw-section">
              <div class="gift-info">
                <div class="winner-name">
                  恭喜 {{ currentPerson?.name }}
                </div>
                <div class="rolling-gift" v-if="isDrawing">
                  {{ currentRollingGift }}
                </div>
                <template v-else>
                  <!-- 显示惩罚任务 -->
                  <div v-if="punishmentResults.length > 0 && !isCompleted" class="hidden-gift-reveal">
                    <div class="reveal-title">
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
                  <!-- 显示最终奖品 -->
                  <div v-if="isCompleted" class="result-summary">
                    <div class="gift-content">
                      <div class="reveal-title">🎉 抽中年会奖品是：</div>
                      <div class="reward-result">
                        <div class="reward-item">{{ rewardResult?.name }}</div>
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
              <template v-if="currentStage === DRAW_STAGES.PERSON">
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
              <template v-else>
                <a-button
                  type="primary"
                  @click="handleDraw"
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
          <template #extra>
            <a-button 
              type="link"
              :disabled="!store.winners.length"
              @click="handleExport"
              title="导出抽奖结果"
            >
              <template #icon><DownloadOutlined /></template>
              导出结果
            </a-button>
          </template>
          <a-table 
            :dataSource="store.winners" 
            :columns="columns" 
            :pagination="{ pageSize: 20 }"
            size="middle"
          />
        </a-card>
      </a-col>
    </a-row>

    <!-- 重置密码验证对话框 -->
    <a-modal
      v-model:open="resetModalVisible"
      title="重置抽奖"
      :confirm-loading="resetConfirmLoading"
      @ok="handleResetConfirm"
      @cancel="handleResetCancel"
    >
      <p>请输入管理密码以确认重置操作：</p>
      <a-input-password
        v-model:value="resetPassword"
        placeholder="请输入管理密码"
        @keyup.enter="handleResetConfirm"
      />
      <p style="margin-top: 16px; color: #ff4d4f;">
        注意：重置后将清空所有抽奖记录，并重置奖品数量和参与人员名单！
      </p>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, computed, onUnmounted, onMounted } from 'vue'
import { useLuckyDrawStore, DRAW_STAGES } from '@/stores/luckyDraw'
import { message, Modal, Button, Input } from 'ant-design-vue'
import { RedoOutlined, DownloadOutlined } from '@ant-design/icons-vue'
import { participants } from '@/config/participants'
import { SETTINGS } from '@/config/settings'
import { getPersonRewardPool, getPersonPunishmentPool } from '@/config/pools'
import * as XLSX from 'xlsx'
import { useRouter } from 'vue-router'

const store = useLuckyDrawStore()
const router = useRouter()

// 定时器变量
let rollingTimer = null
let autoStopTimer = null
let highlightTimer = null

// 组件内部状态
const isDrawing = ref(false)
const currentStage = ref(DRAW_STAGES.PERSON)
const currentPerson = ref(null)
const currentRollingName = ref('')
const currentRollingTask = ref('')
const currentRollingGift = ref('')
const punishmentResults = ref([])
const rewardResult = ref(null)
const isCompleted = ref(false)

// 重置相关的状态
const resetModalVisible = ref(false)
const resetPassword = ref('')
const resetConfirmLoading = ref(false)

// 计算属性
const canDrawPerson = computed(() => store.availableParticipants.length > 0)
const drawButtonText = computed(() => {
  if (isDrawing.value) return '停止'
  if (isCompleted.value) return '抬走，有请下一位'
  return '抽取奖品'
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

// 开始滚动奖品名称（统一的滚动效果）
const startRollingPrize = () => {
  const allPrizes = store.allPrizes
  let lastIndex = -1
  
  rollingTimer = setInterval(() => {
    let randomIndex
    do {
      randomIndex = Math.floor(Math.random() * allPrizes.length)
    } while (randomIndex === lastIndex && allPrizes.length > 1)
    
    lastIndex = randomIndex
    currentRollingGift.value = allPrizes[randomIndex]
  }, 50)

  // 自动停止
  const randomDuration = 1000 + Math.random() * 2000
  autoStopTimer = setTimeout(() => {
    if (isDrawing.value) {
      handleDraw()
    }
  }, randomDuration)
}

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
    currentStage.value = DRAW_STAGES.PUNISHMENT
    currentRollingName.value = ''
    message.success(`已抽中: ${person.name}`)
  }
}

// 统一的抽取处理方法
const handleDraw = () => {
  if (isCompleted.value) {
    handleReset()
    return
  }

  if (!isDrawing.value) {
    // 开始抽取
    isDrawing.value = true
    startRollingPrize()
  } else {
    // 停止抽取
    isDrawing.value = false
    stopRolling()

    // 先尝试抽取惩罚任务
    if (!punishmentResults.value.length) {
      const results = store.drawPunishment()
      punishmentResults.value = results
      currentRollingGift.value = ''

      if (results && results.length > 0) {
        message.success('恭喜抽中趣味任务！')
        return
      }
    }

    // 如果没有抽中任务，或者已经显示过任务，就抽取奖品
    const reward = store.drawGift()
    currentRollingGift.value = ''
    if (reward) {
      rewardResult.value = reward
      isCompleted.value = true
      message.success('恭喜抽中奖品！')
    }
  }
}

const handleReset = () => {
  currentStage.value = DRAW_STAGES.PERSON
  currentPerson.value = null
  currentRollingName.value = ''
  currentRollingGift.value = ''
  punishmentResults.value = []
  rewardResult.value = null
  isCompleted.value = false
  isDrawing.value = false
}

/**
 * 开始名字滚动动画
 * 实现随机滚动效果并在一定时间后自动停止
 */
const startRollingName = () => {
  // 记录上一次随机的索引,用于避免连续显示同一个名字
  let lastIndex = -1
  
  // 设置定时器,每50ms随机选择一个新名字
  rollingTimer = setInterval(() => {
    const participants = store.availableParticipants
    let randomIndex
    
    // 生成随机索引,避免和上次相同(当参与者超过1人时)
    do {
      // Math.random()生成[0,1)之间的随机数
      // Math.floor向下取整,确保索引在合法范围内
      randomIndex = Math.floor(Math.random() * participants.length)
    } while (randomIndex === lastIndex && participants.length > 1)
    
    // 更新上一次的索引
    lastIndex = randomIndex
    // 更新当前展示的名字
    currentRollingName.value = participants[randomIndex].name
  }, 50) // 50ms的间隔确保动画流畅

  // 设置随机的自动停止时间(1-3秒之间)
  const randomDuration = 1000 + Math.random() * 2000
  // 设置自动停止定时器
  autoStopTimer = setTimeout(() => {
    // 如果还在抽奖中,则触发停止
    if (isDrawing.value) {
      handleDrawPerson()
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

// 显示重置确认对话框
const showResetConfirm = () => {
  console.log('showResetConfirm')
  resetModalVisible.value = true
  resetPassword.value = 'asiainfo'
}

// 处理重置确认
const handleResetConfirm = () => {
  if (resetPassword.value !== SETTINGS.ADMIN_PASSWORD) {
    message.error('管理密码错误')
    return
  }

  resetConfirmLoading.value = true
  
  // 延迟一下以显示loading效果
  setTimeout(() => {
    try {
      store.clearStorage()
      message.success('重置成功')
      resetModalVisible.value = false
      // 重置后刷新页面以重新加载数据
      window.location.reload()
    } catch (error) {
      message.error('重置失败')
    } finally {
      resetConfirmLoading.value = false
      resetPassword.value = ''
    }
  }, 500)
}

// 处理取消重置
const handleResetCancel = () => {
  resetModalVisible.value = false
  resetPassword.value = ''
}

// 导出Excel
const handleExport = () => {
  try {
    // 准备导出数据
    const exportData = store.winners.map(winner => ({
      '姓名': winner.winner.name,
      '奖品': winner.prize.name,
      '趣味任务': winner.tasks.map(task => task.name).join('、') || '无',
      '抽奖时间': new Date(winner.timestamp).toLocaleString()
    }))

    // 创建工作簿
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(exportData)

    // 设置列宽
    const colWidths = [
      { wch: 10 },  // 姓名
      { wch: 20 },  // 奖品
      { wch: 30 },  // 趣味任务
      { wch: 20 }   // 抽奖时间
    ]
    ws['!cols'] = colWidths

    // 添加工作表到工作簿
    XLSX.utils.book_append_sheet(wb, ws, '抽奖结果')

    // 生成文件名
    const fileName = `抽奖结果_${new Date().toLocaleDateString()}.xlsx`

    // 导出文件
    XLSX.writeFile(wb, fileName)
    message.success('导出成功！')
  } catch (error) {
    console.error('导出失败:', error)
    message.error('导出失败，请重试')
  }
}

const goToSpecDraw = () => {
  router.push('/spec-draw')
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
  color: #ffffff;
  background: linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%);
  transform: scale(1.08);
  box-shadow: 0 4px 12px rgba(255, 77, 79, 0.2);
  z-index: 1;
  font-weight: bold;
}

.candidate-item.active {
  color: #ffffff;
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

.title-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.reset-button {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  padding: 4px 8px;
  border-radius: 4px;
  transition: all 0.3s ease;
}

.reset-button:hover {
  background: rgba(255, 77, 79, 0.1);
}

.reset-button :deep(.anticon) {
  font-size: 14px;
}

.title-section {
  display: flex;
  align-items: center;
  gap: 16px;
}

.spec-draw-btn {
  font-size: 16px;
  font-weight: 500;
  color: #ff4d4f;
  padding: 4px 12px;
  border-radius: 4px;
  transition: all 0.3s ease;
}

.spec-draw-btn:hover {
  background: rgba(255, 77, 79, 0.1);
}
</style> 