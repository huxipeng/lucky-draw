<template>
  <div class="stage-container">
    <div class="reward-info">
      <div class="winner-name">
        {{ currentPerson?.name }}
      </div>
      <div class="pool-name">
        奖励池：{{ currentPool?.name }}
      </div>
      <div class="rolling-reward" v-if="isDrawing">
        {{ currentReward }}
      </div>
    </div>
    <div class="punishments-preview" v-if="punishments.length">
      <div class="preview-title">已获得惩罚：</div>
      <div class="preview-list">
        <div v-for="(punishment, index) in punishments" :key="index" class="preview-item">
          {{ punishment.name }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps } from 'vue'
defineProps({
  currentPerson: {
    type: Object,
    default: null
  },
  currentPool: {
    type: Object,
    default: null
  },
  currentReward: {
    type: String,
    default: ''
  },
  punishments: {
    type: Array,
    default: () => []
  },
  isDrawing: {
    type: Boolean,
    default: false
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
  gap: 40px;
}

.reward-info {
  text-align: center;
}

.winner-name {
  font-size: 36px;
  font-weight: bold;
  background: linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 16px;
  text-shadow: 0 2px 4px rgba(255, 77, 79, 0.1);
}

.pool-name {
  font-size: 24px;
  color: #666;
  margin-bottom: 20px;
  padding: 12px 24px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(255, 77, 79, 0.1);
}

.rolling-reward {
  font-size: 48px;
  font-weight: bold;
  background: linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: textGlow 2s ease-in-out infinite;
  padding: 20px;
}

.punishments-preview {
  width: 100%;
  max-width: 600px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(255, 77, 79, 0.1);
}

.preview-title {
  font-size: 18px;
  color: #666;
  margin-bottom: 16px;
  text-align: center;
}

.preview-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: center;
}

.preview-item {
  padding: 8px 16px;
  background: rgba(255, 77, 79, 0.1);
  color: #ff4d4f;
  border-radius: 20px;
  font-size: 16px;
}

@keyframes textGlow {
  0%, 100% { opacity: 0.9; }
  50% { opacity: 1; }
}
</style> 