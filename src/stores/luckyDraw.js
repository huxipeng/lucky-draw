import { defineStore } from 'pinia'
import { 
  defaultRewardPool,
  specialRewardPools,
  getPersonPunishmentPool,
  getPersonRewardPool,
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
    // 基础数据
    participants: [],
    availableParticipants: [],
    
    // 奖品库存状态
    rewardInventory: new Map(), // 用于跟踪奖品剩余数量
    
    // 获奖记录
    winners: []
  }),

  getters: {
    availablePrizes: (state) => {
      const currentPerson = state.winners[state.winners.length - 1]?.winner
      if (!currentPerson) return []
      
      const currentRewardPool = getPersonRewardPool(currentPerson.name)
      return currentRewardPool.items.filter(item => {
        const remainingCount = state.rewardInventory.get(item.id) ?? 0
        return remainingCount > 0
      })
    }
  },

  actions: {
    // 导入参与者
    importParticipants(participants) {
      this.participants = participants
      this.resetAvailableParticipants()
      this.initializeInventory()
    },

    // 初始化奖品库存
    initializeInventory() {
      this.rewardInventory.clear()
      // 初始化默认奖励池的库存
      defaultRewardPool.items.forEach(item => {
        this.rewardInventory.set(item.id, item.count)
      })
      // 初始化特殊奖励池的库存
      specialRewardPools.forEach(pool => {
        pool.items.forEach(item => {
          this.rewardInventory.set(item.id, item.count)
        })
      })
    },

    // 重置可用参与者
    resetAvailableParticipants() {
      this.availableParticipants = [...this.participants]
    },

    // 抽取参与者
    drawPerson() {
      const person = this.availableParticipants[Math.floor(Math.random() * this.availableParticipants.length)]
      this.availableParticipants = this.availableParticipants.filter(p => p.id !== person.id)
      return person
    },

    // 抽取礼物
    drawGift(person) {
      // 获取对应的奖励池
      const rewardPool = getPersonRewardPool(person.name)
      const punishmentPool = getPersonPunishmentPool(person.name)
      
      // 处理惩罚任务
      let punishmentResults = []
      const count = getRandomCountByProbability(punishmentPool.drawCountProbability)
      if (count > 0) {
        const availablePunishments = [...punishmentPool.items]
        for (let i = 0; i < count; i++) {
          if (availablePunishments.length === 0) break
          const randomIndex = Math.floor(Math.random() * availablePunishments.length)
          const punishment = availablePunishments.splice(randomIndex, 1)[0]
          punishmentResults.push({
            poolName: punishmentPool.name,
            name: punishment.name,
            id: punishment.id
          })
        }
      }
      
      // 抽取奖励
      const availablePrizes = rewardPool.items.filter(item => {
        const remainingCount = this.rewardInventory.get(item.id) ?? 0
        return remainingCount > 0
      })
      
      if (availablePrizes.length === 0) {
        return { punishmentResults, reward: null }
      }
      
      const reward = availablePrizes[Math.floor(Math.random() * availablePrizes.length)]
      
      // 更新库存
      const remainingCount = this.rewardInventory.get(reward.id) ?? 0
      if (remainingCount > 0) {
        this.rewardInventory.set(reward.id, remainingCount - 1)
      }
      
      // 添加到获奖记录
      this.winners.push({
        winner: person,
        prize: reward,
        tasks: punishmentResults,
        timestamp: new Date().getTime()
      })
      
      return { punishmentResults, reward }
    },

    // 完全重置
    reset() {
      this.winners = []
      this.resetAvailableParticipants()
      this.initializeInventory()
    }
  }
}) 