import { defineStore } from 'pinia'
import { punishmentPools, rewardPools, personRewardPoolMap } from '@/config/pools'

// 抽奖阶段枚举
export const DRAW_STAGES = {
  IDLE: 'idle',              // 初始状态
  PERSON: 'person',          // 抽人阶段
  PUNISHMENT_POOLS: 'punishment_pools',  // 抽惩罚池阶段
  PUNISHMENT: 'punishment',   // 抽惩罚阶段
  REWARD: 'reward',          // 抽奖励阶段
  COMPLETED: 'completed'     // 完成状态
}

export const useLuckyDrawStore = defineStore('luckyDraw', {
  state: () => ({
    // 基础状态
    isDrawing: false,
    currentStage: DRAW_STAGES.IDLE,
    participants: [],
    availableParticipants: [],
    
    // 当前抽中的人
    currentPerson: null,
    
    // 惩罚相关状态
    selectedPunishmentPools: [], // 被选中的惩罚池
    currentPunishmentPool: null, // 当前正在抽取的惩罚池
    punishmentResults: [],       // 抽中的惩罚结果
    
    // 奖励相关状态
    currentRewardPool: null,     // 当前可用的奖励池
    rewardResult: null,          // 抽中的奖励结果
    
    // 历史记录
    winners: []
  }),

  getters: {
    // 现有的 getters
    availablePrizes: (state) => {
      if (!state.currentRewardPool) return []
      return state.currentRewardPool.items.filter(item => 
        !state.winners.some(w => w.prize.id === item.id)
      )
    },
    
    // 新增 getters
    currentStageText: (state) => {
      const stageMap = {
        [DRAW_STAGES.IDLE]: '准备开始',
        [DRAW_STAGES.PERSON]: '抽取幸运观众',
        [DRAW_STAGES.PUNISHMENT_POOLS]: '抽取惩罚池',
        [DRAW_STAGES.PUNISHMENT]: '抽取惩罚',
        [DRAW_STAGES.REWARD]: '抽取奖励',
        [DRAW_STAGES.COMPLETED]: '抽奖完成'
      }
      return stageMap[state.currentStage]
    },
    
    canProceedToNextStage: (state) => {
      switch (state.currentStage) {
        case DRAW_STAGES.PUNISHMENT:
          return state.punishmentResults.length === state.selectedPunishmentPools.length
        case DRAW_STAGES.REWARD:
          return !!state.rewardResult
        default:
          return true
      }
    }
  },

  actions: {
    // 导入参与者
    importParticipants(participants) {
      this.participants = participants
      this.resetAvailableParticipants()
    },

    // 重置可用参与者
    resetAvailableParticipants() {
      this.availableParticipants = [...this.participants]
    },

    // 开始抽奖
    startDraw() {
      this.isDrawing = true
    },

    // 停止抽奖
    stopDraw() {
      this.isDrawing = false
    },

    // 设置当前抽中的人
    setCurrentPerson(person) {
      this.currentPerson = person
      this.availableParticipants = this.availableParticipants.filter(p => p.id !== person.id)
      
      // 设置对应的奖励池
      const poolId = personRewardPoolMap[person.name]
      this.currentRewardPool = rewardPools.find(pool => pool.id === poolId)
      
      // 进入下一阶段
      this.currentStage = DRAW_STAGES.PUNISHMENT_POOLS
    },

    // 抽取惩罚池数量
    drawPunishmentPools() {
      const count = Math.floor(Math.random() * 4) // 0-3个
      const availablePools = [...punishmentPools]
      this.selectedPunishmentPools = []
      
      for (let i = 0; i < count; i++) {
        const randomIndex = Math.floor(Math.random() * availablePools.length)
        this.selectedPunishmentPools.push(availablePools.splice(randomIndex, 1)[0])
      }
      
      this.currentStage = count > 0 ? DRAW_STAGES.PUNISHMENT : DRAW_STAGES.REWARD
    },

    // 添加惩罚结果
    addPunishmentResult(punishment) {
      this.punishmentResults.push(punishment)
      
      // 检查是否所有惩罚池都抽取完成
      if (this.punishmentResults.length === this.selectedPunishmentPools.length) {
        this.currentStage = DRAW_STAGES.REWARD
      }
    },

    // 添加奖励结果
    addRewardResult(reward) {
      this.rewardResult = reward
      this.currentStage = DRAW_STAGES.COMPLETED
      
      // 添加到获奖记录
      this.winners.push({
        winner: this.currentPerson,
        prize: reward,
        punishments: this.punishmentResults,
        timestamp: new Date().getTime()
      })
    },

    // 重置当前抽奖
    resetCurrent() {
      this.currentPerson = null
      this.selectedPunishmentPools = []
      this.currentPunishmentPool = null
      this.punishmentResults = []
      this.currentRewardPool = null
      this.rewardResult = null
      this.currentStage = DRAW_STAGES.IDLE
      this.isDrawing = false
    },

    // 完全重置
    reset() {
      this.resetCurrent()
      this.winners = []
      this.resetAvailableParticipants()
    }
  }
}) 