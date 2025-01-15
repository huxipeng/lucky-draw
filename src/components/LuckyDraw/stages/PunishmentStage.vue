<template>
  <div class="stage-container">
    <div class="punishment-info">
      <div class="current-pool">
        当前惩罚池：{{ currentPool?.name }}
      </div>
      <div class="rolling-punishment" v-if="isDrawing">
        {{ currentPunishment }}
      </div>
    </div>
    <div class="results-list">
      <div v-for="(result, index) in results" :key="index" class="result-item">
        <div class="pool-name">{{ result.poolName }}</div>
        <div class="punishment-name">{{ result.name }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps } from 'vue'
defineProps({
  currentPool: {
    type: Object,
    default: null
  },
  currentPunishment: {
    type: String,
    default: ''
  },
  results: {
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
  justify-content: flex-start;
  gap: 30px;
  padding: 20px;
}

.punishment-info {
  text-align: center;
  margin-bottom: 30px;
}

.current-pool {
  font-size: 24px;
  color: #666;
  margin-bottom: 20px;
  padding: 12px 24px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(255, 77, 79, 0.1);
}

.rolling-punishment {
  font-size: 36px;
  font-weight: bold;
  background: linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: textGlow 2s ease-in-out infinite;
  padding: 20px;
}

.results-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
  max-width: 600px;
}

.result-item {
  background: rgba(255, 255, 255, 0.9);
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(255, 77, 79, 0.1);
  transition: all 0.3s ease;
}

.result-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 77, 79, 0.15);
}

.pool-name {
  font-size: 16px;
  color: #999;
  margin-bottom: 8px;
}

.punishment-name {
  font-size: 24px;
  color: #ff4d4f;
  font-weight: bold;
}

@keyframes textGlow {
  0%, 100% { opacity: 0.9; }
  50% { opacity: 1; }
}
</style> 