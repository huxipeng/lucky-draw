<template>
  <div class="spec-draw">
    <!-- 添加彩花容器到最外层 -->
    <div v-if="showResult" class="confetti-container">
      <div v-for="n in 100" :key="n" class="confetti" :style="getConfettiStyle(n)"></div>
    </div>
    
    <a-row :gutter="[16, 16]" class="draw-container">
      <a-col :span="24">
        <a-card class="draw-area">
          <template #title>
            <div class="card-title-wrapper">
              <div class="title-section">
                <span class="title-text">年终大奖</span>
                <a-button 
                  type="link" 
                  class="spec-draw-btn"
                  @click="goToLuckyDraw"
                >
                  幸运抽奖入口
                </a-button>
              </div>
              <div class="title-actions">
                <a-button 
                  type="primary"
                  size="large"
                  :disabled="isDrawing"
                  @click="startDraw"
                  class="action-btn"
                >
                  开始抽奖
                </a-button>
              </div>
            </div>
          </template>

          <!-- 抽奖主区域 -->
          <div class="draw-main">
            <div ref="tagCloudContainer" class="tag-cloud-container"></div>
            
            <!-- 倒计时动画 -->
            <div v-if="showCountdown" class="countdown-container">
              <div class="countdown-number">{{ countdown }}</div>
            </div>

            <!-- 中奖结果 -->
            <a-modal
              v-model:visible="showResult"
              :footer="null"
              :maskClosable="false"
              centered
              width="600px"
              class="result-modal"
            >
              <div class="result-content">
                <div class="result-header">
                  <div class="crown">👑</div>
                  <div class="congratulations">恭喜中奖</div>
                </div>
                <div class="winner-info">
                  <div class="winner-avatar">{{ winner.charAt(0) }}</div>
                  <div class="winner-name">{{ winner }}</div>
                </div>
                <div class="result-footer">
                  <div class="sparkles">✨ 年终大奖 ✨</div>
                </div>
              </div>
            </a-modal>
          </div>
        </a-card>
      </a-col>
    </a-row>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { participants } from '@/config/participants'
import { annualAwardPool } from '@/config/pools'  // 导入年终大奖池

const router = useRouter()
const tagCloudContainer = ref(null)
const isDrawing = ref(false)
const showResult = ref(false)
const winner = ref('')
const showCountdown = ref(false)
const countdown = ref(10)
let radius = 350
let dtr = Math.PI/180
let d = 500
let mcList = []
let active = false
let lasta = 1
let lastb = 1
let distr = true
let tspeed = 5
let baseSpeed = 0.05
let size = 450
let mouseX = 0
let mouseY = 0
let howElliptical = 1
let aA = null
let oDiv = null
let sa = 0
let ca = 0
let sb = 0
let cb = 0
let sc = 0
let cc = 0
let intervalId = null
let autoRotateInterval = null
let rotationX = 0
let rotationY = 0
let rotationZ = 0
let rotationDirection = { x: 1, y: 1, z: 1 }
let drawTimer = null

const goToLuckyDraw = () => {
  router.push('/')
}

const update = () => {
  let a
  let b

  if (active) {
    a = (-Math.min(Math.max(-mouseY, -size), size) / radius) * tspeed
    b = (Math.min(Math.max(-mouseX, -size), size) / radius) * tspeed
  } else {
    a = lasta * 0.98 + baseSpeed
    b = lastb * 0.98 + baseSpeed
  }
  
  lasta = a
  lastb = b

  sineCosine(a, b, 0)

  for (let j = 0; j < mcList.length; j++) {
    let rx1 = mcList[j].cx
    let ry1 = mcList[j].cy * ca + mcList[j].cz * (-sa)
    let rz1 = mcList[j].cy * sa + mcList[j].cz * ca

    let rx2 = rx1 * cb + rz1 * sb
    let ry2 = ry1
    let rz2 = rx1 * (-sb) + rz1 * cb

    let rx3 = rx2 * cc + ry2 * (-sc)
    let ry3 = rx2 * sc + ry2 * cc
    let rz3 = rz2

    mcList[j].cx = rx3
    mcList[j].cy = ry3
    mcList[j].cz = rz3

    let per = d / (d + rz3)

    mcList[j].x = (howElliptical * rx3 * per) - (howElliptical * 2)
    mcList[j].y = ry3 * per
    mcList[j].scale = per
    mcList[j].alpha = per

    mcList[j].alpha = (mcList[j].alpha - 0.6) * (10/6)
  }

  doPosition()
  depthSort()
}

const depthSort = () => {
  let aTmp = []

  for (let i=0; i<aA.length; i++) {
    aTmp.push(aA[i])
  }

  aTmp.sort(function (vItem1, vItem2) {
    if (vItem1.cz > vItem2.cz) {
      return -1
    } else if (vItem1.cz < vItem2.cz) {
      return 1
    } else {
      return 0
    }
  })

  for (let i=0; i<aTmp.length; i++) {
    aTmp[i].style.zIndex = i
  }
}

const positionAll = () => {
  let phi = 0
  let theta = 0
  let max = mcList.length
  let i = 0

  let aTmp = []
  let oFragment = document.createDocumentFragment()
  
  for (i = 0; i < aA.length; i++) {
    aTmp.push(aA[i])
  }

  aTmp.sort(function () {
    return Math.random() < 0.5 ? 1 : -1
  })

  for (i = 0; i < aTmp.length; i++) {
    oFragment.appendChild(aTmp[i])
  }
  
  oDiv.appendChild(oFragment)

  for (let i = 1; i < max + 1; i++) {
    if (distr) {
      phi = Math.acos(-1 + (2 * i - 1) / max)
      theta = Math.sqrt(max * Math.PI) * phi
    } else {
      phi = Math.random() * (Math.PI)
      theta = Math.random() * (2 * Math.PI)
    }

    mcList[i - 1].cx = radius * Math.cos(theta) * Math.sin(phi)
    mcList[i - 1].cy = radius * Math.sin(theta) * Math.sin(phi)
    mcList[i - 1].cz = radius * Math.cos(phi)
  }
}

const doPosition = () => {
  let l = oDiv.offsetWidth / 2
  let t = oDiv.offsetHeight / 2 - 40

  for (let i = 0; i < mcList.length; i++) {
    if (mcList[i].alpha > 0.1) {
      let item = aA[i]
      item.style.left = mcList[i].cx + l - item.offsetWidth/2 + 'px'
      item.style.top = mcList[i].cy + t - item.offsetHeight/2 + 'px'
      item.style.fontSize = Math.ceil(18 * mcList[i].scale/2) + 12 + 'px'
      item.style.opacity = mcList[i].alpha
    } else {
      let item = aA[i]
      item.style.opacity = 0
    }
  }
}

const sineCosine = (a, b, c) => {
  sa = Math.sin(a * dtr)
  ca = Math.cos(a * dtr)
  sb = Math.sin(b * dtr)
  cb = Math.cos(b * dtr)
  sc = Math.sin(c * dtr)
  cc = Math.cos(c * dtr)
}

const initTags = () => {
  oDiv = tagCloudContainer.value
  aA = oDiv.getElementsByTagName('span')

  for (let i = 0; i < aA.length; i++) {
    mcList.push({
      cx: 0,
      cy: 0,
      cz: 0,
      x: 0,
      y: 0,
      scale: 1,
      alpha: 1
    })
  }

  sineCosine(0, 0, 0)
  positionAll()
  
  oDiv.onmouseover = () => {
    active = true
  }
  
  oDiv.onmouseout = () => {
    active = false
  }
  
  oDiv.onmousemove = (ev) => {
    let oEvent = window.event || ev
    mouseX = oEvent.clientX - (oDiv.offsetLeft + oDiv.offsetWidth/2)
    mouseY = oEvent.clientY - (oDiv.offsetTop + oDiv.offsetHeight/2)
    mouseX /= 5
    mouseY /= 5
  }

  if (intervalId) {
    clearInterval(intervalId)
  }
  intervalId = setInterval(update, 30)
}

const startDraw = () => {
  // 重置倒计时
  countdown.value = 10
  showCountdown.value = false
  
  isDrawing.value = true
  tspeed = 15
  baseSpeed = 0.2

  // 5秒后开始倒计时
  setTimeout(() => {
    showCountdown.value = true
    const countdownInterval = setInterval(() => {
      countdown.value--
      if (countdown.value <= 0) {
        clearInterval(countdownInterval)
        showCountdown.value = false
        stopDraw()
      }
    }, 1000)
  }, 5000)
}

const stopDraw = () => {
  isDrawing.value = false
  showCountdown.value = false
  countdown.value = 10
  tspeed = 5
  baseSpeed = 0.05
  // 从年终大奖池中随机抽取获奖者
  const randomIndex = Math.floor(Math.random() * annualAwardPool.participants.length)
  winner.value = annualAwardPool.participants[randomIndex]
  showResult.value = true
}

// 修改彩花生成函数
const getConfettiStyle = (n) => {
  const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min
  const colors = [
    '#ff4d4f', '#ff7875', '#ffa39e', '#ffccc7', '#fff1f0',
    '#ffd666', '#ffc53d', '#fadb14', // 添加金色
    '#95de64', '#73d13d', '#389e0d', // 添加绿色
    '#40a9ff', '#1890ff', '#096dd9'  // 添加蓝色
  ]
  
  return {
    '--rotation': `${rand(0, 360)}deg`,
    '--animation-delay': `${(n * 0.05)}s`,  // 减小延迟
    '--hue': colors[Math.floor(Math.random() * colors.length)],
    '--fall-delay': `${rand(1, 3)}s`,  // 减小延迟
    left: `${rand(0, 100)}%`,
    top: `-50px`,  // 调整起始位置
    width: `${rand(8, 12)}px`,  // 随机宽度
    height: `${rand(16, 24)}px`  // 随机高度
  }
}

onMounted(() => {
  // 展示效果仍然使用所有参与者
  participants.forEach(person => {
    const span = document.createElement('span')
    span.textContent = person.name
    span.style.position = 'absolute'
    span.style.cursor = 'pointer'
    tagCloudContainer.value.appendChild(span)
  })
  
  initTags()
})

onBeforeUnmount(() => {
  if (intervalId) {
    clearInterval(intervalId)
  }
  if (drawTimer) {
    clearTimeout(drawTimer)
  }
  if (tagCloudContainer.value) {
    tagCloudContainer.value.innerHTML = ''
  }
})
</script>

<style scoped>
.spec-draw {
  height: 100vh;
  width: 100%;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #fff5f5 0%, #fff1f0 100%);
  overflow: hidden;
}

.draw-container {
  flex: 1;
  padding: 8px !important;
  display: flex;
  flex-direction: column;
}

.draw-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: rgba(255, 255, 255, 0.5) !important;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1) !important;
  overflow: hidden;
}

.card-title-wrapper {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 6px 0px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  position: relative;
  z-index: 1000;
}

.title-section {
  display: flex;
  align-items: center;
  gap: 16px;
}

.title-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  position: relative;
  z-index: 1001;
}

.action-btn {
  height: 48px;
  padding: 0 32px;
  font-size: 18px;
  border-radius: 24px;
  position: relative;
  z-index: 1001;
  background: linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%);
  border: none;
  color: white;
  font-weight: 500;
  box-shadow: 0 8px 16px rgba(255, 77, 79, 0.3);
  transition: all 0.3s ease;
}

.action-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 20px rgba(255, 77, 79, 0.4);
  background: linear-gradient(135deg, #ff7875 0%, #ff4d4f 100%);
}

.action-btn:active {
  transform: translateY(1px);
  box-shadow: 0 5px 12px rgba(255, 77, 79, 0.4);
}

.action-btn[disabled] {
  background: linear-gradient(135deg, #ffa39e 0%, #ffccc7 100%);
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.action-btn::after {
  content: '';
  position: absolute;
  top: -2px;
  left: -2px;
  right: -2px;
  bottom: -2px;
  background: linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%);
  border-radius: 25px;
  z-index: -1;
  opacity: 0;
  transition: all 0.3s ease;
}

.title-text {
  font-size: 20px;
  color: rgba(0, 0, 0, 0.85);
  font-weight: 500;
}

.lucky-draw-btn {
  font-size: 16px;
  font-weight: 500;
  color: #ff4d4f;
  padding: 4px 12px;
  border-radius: 4px;
  transition: all 0.3s ease;
}

.lucky-draw-btn:hover {
  background: rgba(255, 77, 79, 0.1);
}

.draw-main {
  flex: 1;
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: 0;
  padding: 0;
  margin-top: -60px;
}

.tag-cloud-container {
  flex: 1;
  position: relative;
  color: #ff4d4f;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  min-height: calc(100vh - 120px);
  transform: translateY(-40px);
  z-index: 1;
  pointer-events: none;
}

.tag-cloud-container span {
  color: #ff4d4f;
  font-weight: bold;
  transition: all 0.3s ease;
  position: absolute;
  text-shadow: 2px 2px 8px rgba(255, 77, 79, 0.3);
  font-size: 24px !important;
  pointer-events: auto;
}

.tag-cloud-container span:hover {
  color: #ff7875;
  text-shadow: 4px 4px 12px rgba(255, 77, 79, 0.5);
  transform: scale(1.2);
}

.result-modal :deep(.ant-modal-content) {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba(255, 245, 245, 0.8) 100%);
  backdrop-filter: blur(15px);
  border-radius: 30px;
  box-shadow: 0 25px 80px rgba(255, 77, 79, 0.3);
  border: 2px solid rgba(255, 255, 255, 0.5);
  overflow: hidden;
  position: relative;
  z-index: 10000;
}

.result-modal :deep(.ant-modal-body) {
  padding: 0;
}

.result-content {
  padding: 60px 40px;
  text-align: center;
  position: relative;
  overflow: hidden;
  animation: content-show 0.8s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 添加装饰性背景 */
.result-content::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: 
    radial-gradient(circle at 20% 20%, rgba(255, 77, 79, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 80% 80%, rgba(255, 215, 0, 0.1) 0%, transparent 50%);
  z-index: -1;
}

/* 添加动态光效 */
.result-content::after {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  right: -50%;
  bottom: -50%;
  background: linear-gradient(
    45deg,
    transparent 0%,
    rgba(255, 255, 255, 0.2) 50%,
    transparent 100%
  );
  animation: light-sweep 3s ease-in-out infinite;
  transform: rotate(45deg);
  z-index: -1;
}

.result-header {
  margin-bottom: 40px;
  position: relative;
}

/* 添加装饰性边框 */
.result-header::before,
.result-header::after {
  content: '';
  position: absolute;
  width: 100px;
  height: 100px;
  border: 3px solid rgba(255, 77, 79, 0.3);
  border-radius: 20px;
  z-index: -1;
}

.result-header::before {
  top: -20px;
  left: -20px;
  border-right: none;
  border-bottom: none;
}

.result-header::after {
  bottom: -20px;
  right: -20px;
  border-left: none;
  border-top: none;
}

.crown {
  font-size: 100px;
  margin-bottom: 30px;
  animation: crown-float 3s ease-in-out infinite;
  text-shadow: 0 0 30px rgba(255, 215, 0, 0.6);
  position: relative;
  display: inline-block;
}

/* 添加皇冠光环效果 */
.crown::before {
  content: '';
  position: absolute;
  width: 120px;
  height: 120px;
  background: radial-gradient(circle, rgba(255, 215, 0, 0.2) 0%, transparent 70%);
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  z-index: -1;
  animation: crown-glow 2s ease-in-out infinite;
}

.congratulations {
  font-size: 56px;
  font-weight: bold;
  background: linear-gradient(45deg, #ff4d4f, #ffd666);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 4px 4px 20px rgba(255, 77, 79, 0.3);
  letter-spacing: 8px;
  margin-bottom: 30px;
  animation: text-glow 2s ease-in-out infinite;
  position: relative;
}

.winner-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 30px;
  margin: 50px 0;
  position: relative;
  padding: 40px 0;
}

/* 添加装饰性圆圈 */
.winner-info::before {
  content: '';
  position: absolute;
  width: 300px;
  height: 300px;
  border: 2px dashed rgba(255, 77, 79, 0.2);
  border-radius: 50%;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  animation: rotate 20s linear infinite;
}

.winner-avatar {
  width: 180px;
  height: 180px;
  border-radius: 90px;
  background: linear-gradient(135deg, #ff4d4f, #ff7875);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 72px;
  color: white;
  font-weight: bold;
  box-shadow: 0 15px 40px rgba(255, 77, 79, 0.4),
              inset 0 0 20px rgba(255, 255, 255, 0.4);
  animation: winner-pulse 2s ease-in-out infinite;
  border: 4px solid rgba(255, 255, 255, 0.8);
  position: relative;
  z-index: 1;
}

/* 添加头像光环效果 */
.winner-avatar::before {
  content: '';
  position: absolute;
  width: 200px;
  height: 200px;
  background: radial-gradient(circle, rgba(255, 77, 79, 0.2) 0%, transparent 70%);
  border-radius: 50%;
  z-index: -1;
  animation: avatar-glow 2s ease-in-out infinite;
}

.winner-name {
  font-size: 64px;
  font-weight: bold;
  background: linear-gradient(45deg, #ff4d4f, #ff7875);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 4px 12px rgba(255, 77, 79, 0.3);
  letter-spacing: 4px;
  animation: name-float 3s ease-in-out infinite;
  position: relative;
}

.result-footer {
  margin-top: 40px;
  position: relative;
  padding: 20px 0;
}

.sparkles {
  font-size: 36px;
  font-weight: bold;
  background: linear-gradient(45deg, #ff4d4f, #ffd666);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 0 20px rgba(255, 77, 79, 0.4);
  animation: sparkle-pulse 2s ease-in-out infinite;
  letter-spacing: 4px;
  position: relative;
  display: inline-block;
}

.countdown-container {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.3);  /* 加深背景 */
  z-index: 1000;
  pointer-events: none;
}

.countdown-number {
  font-size: 400px;  /* 增大字体 */
  font-weight: bold;
  color: #ff4d4f;
  text-shadow: 0 0 40px rgba(255, 77, 79, 0.8);  /* 增强阴影 */
  animation: countdown-animation 1s ease-in-out infinite;
  -webkit-text-stroke: 4px #fff;  /* 添加白色描边 */
}

.spec-draw-btn {
  font-size: 16px;
  font-weight: 500;
  color: #ff4d4f;
  padding: 4px 12px;
  border-radius: 4px;
  transition: all 0.3s ease;
}

.spec-draw-btn:hover {
  background: rgba(255, 77, 79, 0.1);
}

@keyframes countdown-animation {
  0% {
    transform: scale(0.8);
    opacity: 0;
  }
  50% {
    transform: scale(1.4);  /* 增大缩放比例 */
    opacity: 1;
  }
  100% {
    transform: scale(1);
    opacity: 0;
  }
}

@keyframes crown-float {
  0%, 100% {
    transform: translateY(0) rotate(0);
  }
  50% {
    transform: translateY(-10px) rotate(5deg);
  }
}

@keyframes text-glow {
  0%, 100% {
    text-shadow: 0 0 20px rgba(255, 77, 79, 0.3);
  }
  50% {
    text-shadow: 0 0 30px rgba(255, 77, 79, 0.6);
  }
}

@keyframes winner-pulse {
  0%, 100% {
    transform: scale(1);
    box-shadow: 0 15px 40px rgba(255, 77, 79, 0.4);
  }
  50% {
    transform: scale(1.05);
    box-shadow: 0 20px 50px rgba(255, 77, 79, 0.6);
  }
}

@keyframes circle-expand {
  0% {
    transform: scale(0.8);
    opacity: 1;
  }
  100% {
    transform: scale(1.2);
    opacity: 0;
  }
}

@keyframes name-float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-5px);
  }
}

@keyframes sparkle-pulse {
  0%, 100% {
    opacity: 0.9;
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(1.1);
  }
}

/* 修改彩花样式 */
.confetti-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  pointer-events: none;
  z-index: 100001;  /* 提高层级 */
}

.confetti {
  position: absolute;
  background: var(--hue);
  width: var(--width);
  height: var(--height);
  transform: rotate(var(--rotation));
  opacity: 1;  /* 修改初始透明度 */
  animation: confetti-fall var(--fall-delay) linear infinite,
             confetti-shake 3s ease-in-out infinite;
  animation-delay: var(--animation-delay);
  border-radius: 2px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
}

@keyframes confetti-fall {
  0% {
    opacity: 1;
    top: -10%;
    transform: translateY(0) rotate(var(--rotation));
  }
  100% {
    opacity: 1;
    top: 110%;
    transform: translateY(0) rotate(calc(var(--rotation) + 360deg));
  }
}

@keyframes confetti-shake {
  0%, 100% {
    transform: translateX(0);
  }
  25% {
    transform: translateX(30px);
  }
  75% {
    transform: translateX(-30px);
  }
}

/* 添加新的动画关键帧 */
@keyframes light-sweep {
  0% {
    transform: rotate(45deg) translateX(-100%);
  }
  100% {
    transform: rotate(45deg) translateX(100%);
  }
}

@keyframes crown-glow {
  0%, 100% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 0.5;
  }
  50% {
    transform: translate(-50%, -50%) scale(1.2);
    opacity: 0.8;
  }
}

@keyframes avatar-glow {
  0%, 100% {
    transform: scale(1);
    opacity: 0.5;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.8;
  }
}

@keyframes rotate {
  from {
    transform: translate(-50%, -50%) rotate(0deg);
  }
  to {
    transform: translate(-50%, -50%) rotate(360deg);
  }
}
</style>
