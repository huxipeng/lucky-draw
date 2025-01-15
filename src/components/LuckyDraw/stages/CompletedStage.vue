<template>
  <div class="stage-container">
    <div class="result-summary">
      <div class="winner-name">
        {{ currentPerson?.name }}
      </div>
      <div class="punishments-list" v-if="punishments.length">
        <div class="list-title">获得惩罚：</div>
        <div class="punishments-grid">
          <div v-for="(punishment, index) in punishments" :key="index" class="punishment-item">
            <div class="pool-name">{{ punishment.poolName }}</div>
            <div class="item-name">{{ punishment.name }}</div>
          </div>
        </div>
      </div>
      <div class="reward-result">
        <div class="list-title">获得奖励：</div>
        <div class="reward-item">
          <div class="pool-name">{{ rewardPool?.name }}</div>
          <div class="item-name">{{ reward?.name }}</div>
        </div>
      </div>
    </div>
    <div class="confetti-container">
      <!-- 这里可以添加庆祝动画效果 -->
    </div>
  </div>
</template>

<script setup>
defineProps({
  currentPerson: {
    type: Object,
    default: null
  },
  punishments: {
    type: Array,
    default: () => []
  },
  reward: {
    type: Object,
    default: null
  },
  rewardPool: {
    type: Object,
    default: null
  }
})
</script>

<style scoped>
.stage-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
}

.result-summary {
  text-align: center;
  padding: 40px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 20px;
  box-shadow: 0 4px 20px rgba(255, 77, 79, 0.15);
  max-width: 800px;
  width: 100%;
  position: relative;
  z-index: 1;
}

.winner-name {
  font-size: 48px;
  font-weight: bold;
  background: linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 32px;
  text-shadow: 0 2px 4px rgba(255, 77, 79, 0.1);
  position: relative;
}

.winner-name::after {
  content: '';
  position: absolute;
  bottom: -16px;
  left: 50%;
  transform: translateX(-50%);
  width: 60px;
  height: 4px;
  background: linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%);
  border-radius: 2px;
}

.list-title {
  font-size: 24px;
  color: #666;
  margin-bottom: 20px;
  font-weight: 500;
}

.punishments-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 32px;
}

.punishment-item, .reward-item {
  background: rgba(255, 77, 79, 0.05);
  border-radius: 12px;
  padding: 16px;
  transition: all 0.3s ease;
}

.punishment-item:hover, .reward-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 77, 79, 0.1);
}

.pool-name {
  font-size: 14px;
  color: #999;
  margin-bottom: 8px;
}

.item-name {
  font-size: 20px;
  color: #ff4d4f;
  font-weight: bold;
}

.reward-result {
  margin-top: 32px;
  padding-top: 32px;
  border-top: 1px dashed rgba(255, 77, 79, 0.2);
}

.reward-item {
  background: linear-gradient(135deg, rgba(255, 77, 79, 0.1) 0%, rgba(255, 120, 117, 0.1) 100%);
  max-width: 400px;
  margin: 0 auto;
}

.reward-item .item-name {
  font-size: 28px;
  background: linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.confetti-container {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 0;
}
</style> 