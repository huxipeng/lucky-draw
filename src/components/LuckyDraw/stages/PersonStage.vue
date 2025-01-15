<template>
  <div class="stage-container">
    <div class="candidates-grid">
      <div
        v-for="participant in participants"
        :key="participant.id"
        class="candidate-item"
        :class="{ 
          'active': !isDrawing && participant.name === currentName,
          'highlight': isDrawing && participant.name === highlightName
        }"
      >
        {{ participant.name }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps } from 'vue'

defineProps({
  participants: {
    type: Array,
    required: true
  },
  currentName: {
    type: String,
    default: ''
  },
  highlightName: {
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
  transition: all 0.15s ease;
  border: 1px solid rgba(255, 77, 79, 0.1);
  position: relative;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.candidate-item.highlight {
  color: #fff;
  background: linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%);
  transform: scale(1.08);
  box-shadow: 0 4px 12px rgba(255, 77, 79, 0.2);
  z-index: 1;
  font-weight: bold;
}

.candidate-item.active {
  color: #fff;
  background: linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%);
  transform: scale(1.08);
  box-shadow: 0 4px 12px rgba(255, 77, 79, 0.2);
  z-index: 1;
  font-weight: bold;
}
</style> 