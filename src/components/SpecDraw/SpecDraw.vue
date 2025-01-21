<template>
  <div class="spec-draw">
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
              title="抽奖结果"
              :footer="null"
              :maskClosable="false"
              centered
            >
              <div class="result-content">
                <div class="winner-info">
                  🎉 恭喜 <span class="winner-name">{{ winner }}</span> 🎉
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
  const randomIndex = Math.floor(Math.random() * participants.length)
  winner.value = participants[randomIndex].name
  showResult.value = true
}

onMounted(() => {
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
  height: 40px;
  padding: 0 24px;
  font-size: 16px;
  border-radius: 20px;
  position: relative;
  z-index: 1001;
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

.result-content {
  text-align: center;
  padding: 32px;
}

.winner-info {
  font-size: 24px;
  color: #ff4d4f;
  font-weight: 500;
}

.winner-name {
  font-size: 32px;
  font-weight: 600;
  color: #ff4d4f;
  margin: 0 12px;
  text-shadow: 2px 2px 8px rgba(255, 77, 79, 0.2);
}

:deep(.ant-card-body) {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 0 !important;
  min-height: 0;
}

:deep(.ant-modal-content) {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

:deep(.ant-modal-header) {
  border-bottom: none;
  padding: 24px 24px 0;
}

:deep(.ant-modal-title) {
  font-size: 24px;
  text-align: center;
  color: #ff4d4f;
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
</style>
