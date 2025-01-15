<template>
  <div class="stage-container">
    <div class="candidates-grid" v-if="!isDrawing">
      <div
        v-for="participant in participants"
        :key="participant.id"
        class="candidate-item"
        :class="{ active: participant.name === currentName }"
      >
        {{ participant.name }}
      </div>
    </div>
    <div v-else class="rolling-display">
      <div class="rolling-name">{{ currentName || '准备开始' }}</div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  participants: {
    type: Array,
    required: true
  },
  currentName: {
    type: String,
    default: ''
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
  justify-content: center;
  align-items: center;
}

.candidates-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(90px, 1fr));
  gap: 10px;
  padding: 16px;
  width: 100%;
  max-height: 380px;
  overflow-y: auto;
  position: relative;
}

.candidate-item {
  padding: 8px 6px;
  text-align: center;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 6px;
  font-size: 15px;
  color: #666;
  transition: all 0.3s ease;
  border: 1px solid rgba(255, 77, 79, 0.1);
  position: relative;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.candidate-item.active {
  color: #fff;
  background: linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%);
  transform: scale(1.08);
  box-shadow: 0 4px 12px rgba(255, 77, 79, 0.2);
  z-index: 1;
  font-weight: bold;
}

.rolling-display {
  text-align: center;
  padding: 40px;
}

.rolling-name {
  font-size: 48px;
  font-weight: bold;
  background: linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: textGlow 2s ease-in-out infinite;
}

@keyframes textGlow {
  0%, 100% { opacity: 0.9; }
  50% { opacity: 1; }
}
</style> 