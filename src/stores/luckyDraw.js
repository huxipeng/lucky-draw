import { defineStore } from 'pinia'
import { punishmentPools, rewardPools, personRewardPoolMap } from '@/config/pools'

// 抽奖阶段枚举
export const DRAW_STAGES = {
  PERSON: 'PERSON',
  GIFT: 'GIFT',      // 改为礼包抽取阶段
  COMPLETED: 'COMPLETED'
}

export const useLuckyDrawStore = defineStore('luckyDraw', {
  state: () => ({
    // 基础状态
    isDrawing: false,
    currentStage: DRAW_STAGES.PERSON,
    participants: [],
    availableParticipants: [],
    
    // 当前抽中的人
    currentPerson: null,
    
    // 礼包相关状态（内部仍然区分惩罚和奖励）
    selectedPunishmentPools: [], 
    punishmentResults: [],
    currentRewardPool: null,
    rewardResult: null,
    
    // 历史记录
    winners: []
  }),

  getters: {
    currentStageText: (state) => {
      const stageMap = {
        [DRAW_STAGES.PERSON]: '抽取幸运观众',
        [DRAW_STAGES.GIFT]: '抽取幸运礼包',
        [DRAW_STAGES.COMPLETED]: '抽奖完成'
      }
      return stageMap[state.currentStage]
    },
    
    availablePrizes: (state) => {
      if (!state.currentRewardPool) return []
      return state.currentRewardPool.items.filter(item => 
        !state.winners.some(w => w.prize.id === item.id)
      )
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

    // 修改抽取流程
    setCurrentPerson(person) {
      this.currentPerson = person
      this.availableParticipants = this.availableParticipants.filter(p => p.id !== person.id)
      
      // 设置对应的奖励池
      const poolId = personRewardPoolMap[person.name]
      this.currentRewardPool = rewardPools.find(pool => pool.id === poolId)
      
      // 在后台自动抽取惩罚池
      this.drawPunishmentPools()
      
      // 进入礼包抽取阶段
      this.currentStage = DRAW_STAGES.GIFT
    },

    // 在后台自动抽取惩罚池
    drawPunishmentPools() {
      const count = Math.floor(Math.random() * 4) // 0-3个
      const availablePools = [...punishmentPools]
      this.selectedPunishmentPools = []
      
      for (let i = 0; i < count; i++) {
        const randomIndex = Math.floor(Math.random() * availablePools.length)
        this.selectedPunishmentPools.push(availablePools.splice(randomIndex, 1)[0])
      }
    },

    // 抽取礼包（包含惩罚和奖励）
    async drawGift() {
      // 在后台处理惩罚抽取
      for (const pool of this.selectedPunishmentPools) {
        const punishment = pool.items[Math.floor(Math.random() * pool.items.length)]
        this.punishmentResults.push(punishment)
      }
      
      // 抽取奖励
      const rewards = this.availablePrizes
      const reward = rewards[Math.floor(Math.random() * rewards.length)]
      this.rewardResult = reward
      
      // 添加到获奖记录
      this.winners.push({
        winner: this.currentPerson,
        prize: reward,
        tasks: this.punishmentResults,  // 改名为 tasks
        timestamp: new Date().getTime()
      })
      
      this.currentStage = DRAW_STAGES.COMPLETED
    },

    // 重置当前抽奖
    resetCurrent() {
      this.currentPerson = null
      this.selectedPunishmentPools = []
      this.punishmentResults = []
      this.currentRewardPool = null
      this.rewardResult = null
      this.currentStage = DRAW_STAGES.PERSON
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