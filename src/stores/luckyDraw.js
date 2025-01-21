import { defineStore } from 'pinia'
import { 
  defaultRewardPool,
  specialRewardPools,
  getPersonPunishmentPool,
  getPersonRewardPool,
  getRandomCountByProbability
} from '@/config/pools'

const STORAGE_KEY = 'lucky-draw-state'
const STORAGE_VERSION = '1.0'

// 保存状态到 localStorage
const saveState = (state) => {
  const data = {
    version: STORAGE_VERSION,
    winners: state.winners,
    participants: state.participants,
    availableParticipants: state.availableParticipants,
    rewardInventory: Array.from(state.rewardInventory.entries()),
    timestamp: new Date().getTime()
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

// 从 localStorage 读取状态
const loadState = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) return null

    const data = JSON.parse(saved)
    if (data.version !== STORAGE_VERSION) {
      console.warn('存储的数据版本不匹配，将使用默认数据')
      return null
    }

    return {
      winners: data.winners,
      participants: data.participants,
      availableParticipants: data.availableParticipants,
      rewardInventory: new Map(data.rewardInventory)
    }
  } catch (error) {
    console.error('读取存储数据失败:', error)
    return null
  }
}

// 抽奖阶段枚举
export const DRAW_STAGES = {
  PERSON: 'PERSON',          // 抽人阶段
  PUNISHMENT: 'PUNISHMENT',  // 抽幸运任务阶段
  GIFT: 'GIFT',             // 抽奖品阶段
  COMPLETED: 'COMPLETED'     // 完成阶段
}

export const useLuckyDrawStore = defineStore('luckyDraw', {
  state: () => {
    // 尝试从 localStorage 读取状态
    const savedState = loadState()
    
    return savedState || {
      // 基础数据
      participants: [],
      availableParticipants: [],
      
      // 奖品库存状态
      rewardInventory: new Map(),
      
      // 获奖记录
      winners: [],

      // 当前抽奖临时状态
      currentPerson: null,
      currentPunishments: []
    }
  },

  getters: {
    // 获取所有奖品（去重）
    allPrizes() {
      const allPrizes = new Set()
      
      // 添加默认奖池的奖品
      defaultRewardPool.items.forEach(item => {
        allPrizes.add(item.name)
      })
      
      // 添加特殊奖池的奖品
      specialRewardPools.forEach(pool => {
        pool.items.forEach(item => {
          allPrizes.add(item.name)
        })
      })
      
      return Array.from(allPrizes)
    }
  },

  actions: {
    // 导入参与者
    importParticipants(participants, forceReset = false) {
      // 如果已经有存储的状态且不是强制重置，就不重新初始化
      if (!forceReset && this.availableParticipants && this.availableParticipants.length > 0) return

      this.participants = participants
      this.resetAvailableParticipants()
      this.initializeInventory()
      
      // 保存初始状态
      saveState(this.$state)
    },

    // 初始化奖品库存
    initializeInventory() {
      this.rewardInventory = new Map()
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
      
      // 保存状态
      saveState(this.$state)
    },

    // 重置可用参与者
    resetAvailableParticipants() {
      this.availableParticipants = [...this.participants]
      saveState(this.$state)
    },

    // 抽取惩罚任务
    drawPunishment(person) {
      if (!person && !this.currentPerson) return null
      const targetPerson = person || this.currentPerson
      
      const punishmentPool = getPersonPunishmentPool(targetPerson.name)
      let punishmentResults = []
      
      // 根据概率决定抽取任务的数量
      const count = getRandomCountByProbability(punishmentPool.drawCountProbability)
      
      // 只有当count大于0时才进行抽取
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

      // 保存当前惩罚结果
      this.currentPunishments = punishmentResults
      
      // 保存状态
      saveState(this.$state)
      
      return punishmentResults
    },

    // 抽取礼物（修改后只负责抽取奖品）
    drawGift(person) {
      if (!person && !this.currentPerson) return null
      const targetPerson = person || this.currentPerson
      
      // 获取对应的奖励池
      const rewardPool = getPersonRewardPool(targetPerson.name)
      
      // 检查是否是特殊奖池且是否还有可用奖品
      let availablePrizes = []
      if (rewardPool !== defaultRewardPool) {
        // 如果是特殊奖池，先检查特殊奖池中的可用奖品
        availablePrizes = rewardPool.items.filter(item => {
          const remainingCount = this.rewardInventory.get(item.id) ?? 0
          return remainingCount > 0
        })

        // 如果特殊奖池没有可用奖品，降级到默认奖池
        if (availablePrizes.length === 0) {
          console.log(`特殊奖池奖品已抽完，降级到默认奖池: ${targetPerson.name}`)
          availablePrizes = defaultRewardPool.items.filter(item => {
            const remainingCount = this.rewardInventory.get(item.id) ?? 0
            return remainingCount > 0
          })
        }
      } else {
        // 如果是默认奖池，直接获取可用奖品
        availablePrizes = rewardPool.items.filter(item => {
          const remainingCount = this.rewardInventory.get(item.id) ?? 0
          return remainingCount > 0
        })
      }
      
      // 如果没有可用奖品，返回null
      if (availablePrizes.length === 0) {
        return null
      }

      // 这里我想把 availablePrizes 再打乱一下
      availablePrizes = availablePrizes.sort(() => Math.random() - 0.5)

      console.log('availablePrizes after', availablePrizes)
      
      // 随机抽取一个奖品
      const reward = availablePrizes[Math.floor(Math.random() * availablePrizes.length)]
      
      // 更新库存
      const remainingCount = this.rewardInventory.get(reward.id) ?? 0
      if (remainingCount > 0) {
        this.rewardInventory.set(reward.id, remainingCount - 1)
      }
      
      // 添加到获奖记录
      this.winners.push({
        winner: targetPerson,
        prize: reward,
        tasks: this.currentPunishments,
        timestamp: new Date().getTime()
      })

      // 清理临时状态
      this.currentPerson = null
      this.currentPunishments = []
      
      // 保存状态
      saveState(this.$state)
      
      return reward
    },

    // 抽取参与者（修改以保存当前抽中的人）
    drawPerson() {
      const person = this.availableParticipants[Math.floor(Math.random() * this.availableParticipants.length)]
      this.availableParticipants = this.availableParticipants.filter(p => p.id !== person.id)
      
      // 保存当前抽中的人
      this.currentPerson = person
      
      // 保存状态
      saveState(this.$state)
      
      return person
    },

    // 完全重置
    reset() {
      this.winners = []
      this.resetAvailableParticipants()
      this.initializeInventory()
      
      // 保存状态
      saveState(this.$state)
    },

    // 清除存储的状态
    clearStorage() {
      localStorage.removeItem(STORAGE_KEY)
      this.reset()
    }
  }
}) 