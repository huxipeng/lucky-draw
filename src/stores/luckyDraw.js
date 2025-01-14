import { defineStore } from 'pinia'

export const useLuckyDrawStore = defineStore('luckyDraw', {
  state: () => ({
    // 奖项设置
    prizes: [
      { id: 1, name: '特等奖', count: 1, remaining: 1 },
      { id: 2, name: '一等奖', count: 3, remaining: 3 },
      { id: 3, name: '二等奖', count: 5, remaining: 5 },
      { id: 4, name: '三等奖', count: 10, remaining: 10 },
    ],
    // 参与人员列表
    participants: [],
    // 中奖记录
    winners: [],
    // 当前选中的人员
    currentPerson: null,
    // 抽奖状态
    isDrawing: false
  }),

  actions: {
    // 导入参与人员
    importParticipants(list) {
      this.participants = list
    },
    // 设置当前选中的人员
    setCurrentPerson(person) {
      this.currentPerson = person
    },
    // 开始抽奖
    startDraw() {
      this.isDrawing = true
    },
    // 停止抽奖
    stopDraw() {
      this.isDrawing = false
    },
    // 记录中奖者
    addWinner(prize) {
      this.winners.push({
        winner: this.currentPerson,
        prize: prize,
        timestamp: new Date().toISOString()
      })
      // 更新奖项剩余数量
      const prizeToUpdate = this.prizes.find(p => p.id === prize.id)
      if (prizeToUpdate) {
        prizeToUpdate.remaining--
      }
      // 清空当前选中的人员
      this.currentPerson = null
    },
    // 重置抽奖
    reset() {
      this.prizes.forEach(prize => {
        prize.remaining = prize.count
      })
      this.winners = []
      this.currentPerson = null
      this.isDrawing = false
    }
  },

  getters: {
    // 获取可用奖项
    availablePrizes: (state) => {
      return state.prizes.filter(prize => prize.remaining > 0)
    },
    // 获取未中奖的参与者
    availableParticipants: (state) => {
      const winnerIds = state.winners.map(w => w.winner.id)
      return state.participants.filter(p => !winnerIds.includes(p.id))
    }
  }
}) 