<template>
  <div class="stage-container">
    <div class="selected-person">
      恭喜 {{ currentPerson?.name }}
    </div>
    <div class="pools-grid">
      <div
        v-for="pool in pools"
        :key="pool.id"
        class="pool-item"
        :class="{ 
          'selected': selectedPools.some(p => p.id === pool.id),
          'rolling': isRolling 
        }"
      >
        {{ pool.name }}
        <div class="pool-preview">
          {{ pool.items.map(item => item.name).join('、') }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  currentPerson: {
    type: Object,
    default: null
  },
  pools: {
    type: Array,
    required: true
  },
  selectedPools: {
    type: Array,
    default: () => []
  },
  isRolling: {
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
  gap: 30px;
}

.selected-person {
  font-size: 36px;
  font-weight: bold;
  background: linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 2px 4px rgba(255, 77, 79, 0.1);
}

.pools-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.pool-item {
  width: 160px;
  height: 160px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 12px;
  padding: 16px;
  transition: all 0.3s ease;
  border: 2px solid rgba(255, 77, 79, 0.1);
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

.pool-item:hover .pool-preview {
  transform: translateY(0);
  opacity: 1;
}

.pool-item .pool-name {
  font-size: 24px;
  color: #666;
  margin-bottom: 8px;
  z-index: 1;
}

.pool-preview {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(255, 77, 79, 0.9);
  color: #fff;
  padding: 8px;
  font-size: 12px;
  transform: translateY(100%);
  opacity: 0;
  transition: all 0.3s ease;
  text-align: center;
}

.pool-item.selected {
  background: linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%);
  color: #fff;
  transform: scale(1.05);
  box-shadow: 0 4px 15px rgba(255, 77, 79, 0.2);
}

.pool-item.selected .pool-preview {
  background: rgba(255, 255, 255, 0.9);
  color: #ff4d4f;
}

.pool-item.rolling {
  animation: poolPulse 1s ease-in-out infinite;
}

@keyframes poolPulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}
</style> 