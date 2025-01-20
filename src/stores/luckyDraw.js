import { defineStore } from 'pinia'
import { 
  rewardPools, 
  personRewardPoolMap, 
  getPersonPunishmentPool,
  getRandomCountByProbability
} from '@/config/pools'

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
    
    // 惩罚和奖励相关状态
    currentPunishmentPool: null, // 当前使用的惩罚池
    punishmentResults: [], // 抽中的惩罚结果
    currentRewardPool: null,
    rewardResult: null,
    hasDrawnHiddenGift: false,
    isFirstDraw: true,
    isCompleted: false,
    
    // 历史记录
    winners: []
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

    // 获取当前抽取按钮的文本
    drawButtonText: (state) => {
      if (state.isDrawing) return '停止'
      if (state.isCompleted) return '抬走，有请下一位'
      if (state.hasDrawnHiddenGift && state.punishmentResults.length > 0) return '继续抽取'
      return '抽取礼品'
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
      
      // 设置对应的惩罚池
      this.currentPunishmentPool = getPersonPunishmentPool(person.name)
      
      // 进入礼包抽取阶段
      this.currentStage = DRAW_STAGES.GIFT
    },

    // 抽取礼包
    async drawGift() {
      if (this.isFirstDraw) {
        // 第一次抽取，处理惩罚
        const punishmentPool = this.currentPunishmentPool
        const count = getRandomCountByProbability(punishmentPool.drawCountProbability)
        
        if (count > 0) {
          // 清空之前的结果
          this.punishmentResults = []
          
          // 随机抽取指定数量的惩罚
          const availablePunishments = [...punishmentPool.items]
          for (let i = 0; i < count; i++) {
            if (availablePunishments.length === 0) break
            
            const randomIndex = Math.floor(Math.random() * availablePunishments.length)
            const punishment = availablePunishments.splice(randomIndex, 1)[0]
            
            this.punishmentResults.push({
              poolName: punishmentPool.name,
              name: punishment.name,
              id: punishment.id
            })
          }
          
          this.hasDrawnHiddenGift = true
          this.isFirstDraw = false
          return true // 返回 true 表示抽中了惩罚
        }
        
        this.isFirstDraw = false
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
      
      // 标记完成
      this.isCompleted = true
      this.currentStage = DRAW_STAGES.COMPLETED
      return false // 返回 false 表示这是最终奖品抽取
    },

    // 重置当前抽奖
    resetCurrent() {
      this.currentPerson = null
      this.currentPunishmentPool = null
      this.punishmentResults = []
      this.currentRewardPool = null
      this.rewardResult = null
      this.currentStage = DRAW_STAGES.PERSON
      this.isDrawing = false
      this.hasDrawnHiddenGift = false
      this.isFirstDraw = true
      this.isCompleted = false
    },

    // 完全重置
    reset() {
      this.resetCurrent()
      this.winners = []
      this.resetAvailableParticipants()
      this.isCompleted = false
      this.currentStage = DRAW_STAGES.PERSON
    }
  }
}) 