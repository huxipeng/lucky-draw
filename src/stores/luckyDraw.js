import { defineStore } from 'pinia'
import { punishmentPools, rewardPools, personRewardPoolMap } from '@/config/pools'

// 抽奖阶段枚举
export const DRAW_STAGES = {
  PERSON: 'PERSON',
  GIFT: 'GIFT',
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
    
    // 礼包相关状态
    selectedPunishmentPools: [], 
    punishmentResults: [],
    currentRewardPool: null,
    rewardResult: null,
    
    // 历史记录
    winners: [],
    hasDrawnHiddenGift: false, // 是否已经抽取了隐藏礼包
    isFirstDraw: true, // 是否是第一次抽取
  }),

  getters: {
    currentStageText: (state) => {
      const stageMap = {
        [DRAW_STAGES.PERSON]: '抽取幸运观众',
        [DRAW_STAGES.GIFT]: '抽取幸运奖品',
        [DRAW_STAGES.COMPLETED]: '抽奖完成'
      }
      return stageMap[state.currentStage]
    },
    
    availablePrizes: (state) => {
      if (!state.currentRewardPool) return []
      return state.currentRewardPool.items.filter(item => 
        !state.winners.some(w => w.prize.id === item.id)
      )
    },

    hasHiddenGift: (state) => {
      return state.selectedPunishmentPools.length > 0
    },

    // 获取当前抽取按钮的文本
    drawButtonText: (state) => {
      if (state.isDrawing) return '停止'
      if (state.hasDrawnHiddenGift && state.hasHiddenGift) return '继续抽取'
      return '开始抽取'
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

    // 修改抽取礼包的方法
    async drawGift() {
      if (this.isFirstDraw) {
        // 第一次抽取，只处理隐藏礼包
        if (this.hasHiddenGift) {
          this.punishmentResults = []  // 清空之前的结果
          for (const pool of this.selectedPunishmentPools) {
            const punishment = pool.items[Math.floor(Math.random() * pool.items.length)]
            this.punishmentResults.push({
              poolName: pool.name,
              name: punishment.name,
              id: punishment.id
            })
          }
          this.hasDrawnHiddenGift = true
          this.isFirstDraw = false
          return true // 返回 true 表示抽中了隐藏礼包
        }
      }
      
      // 抽取奖励
      const rewards = this.availablePrizes
      const reward = rewards[Math.floor(Math.random() * rewards.length)]
      this.rewardResult = reward
      
      // 添加到获奖记录
      this.winners.push({
        winner: this.currentPerson,
        prize: reward,
        tasks: this.punishmentResults,
        timestamp: new Date().getTime()
      })
      
      // 完成抽取
      this.currentStage = DRAW_STAGES.COMPLETED
      return false // 返回 false 表示这是最终奖品抽取
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
      this.hasDrawnHiddenGift = false
      this.isFirstDraw = true
    },

    // 完全重置
    reset() {
      this.resetCurrent()
      this.winners = []
      this.resetAvailableParticipants()
    }
  }
}) 