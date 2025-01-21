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
                  class="lucky-draw-btn"
                  @click="goToLuckyDraw"
                >
                  幸运抽奖
                </a-button>
              </div>
              <div class="title-actions">
                <a-button 
                  type="text" 
                  @click="goToLuckyDraw"
                >
                  返回
                </a-button>
              </div>
            </div>
          </template>

          <!-- 抽奖主区域 -->
          <div class="draw-main">
            <div ref="tagCloudContainer" class="tag-cloud-container"></div>
            <div class="controls">
              <a-button 
                type="primary" 
                size="large"
                :disabled="isDrawing"
                @click="startDraw"
              >
                开始抽奖
              </a-button>
              <a-button 
                type="primary" 
                danger
                size="large"
                :disabled="!isDrawing"
                @click="stopDraw"
              >
                停止抽奖
              </a-button>
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

const router = useRouter()
const tagCloudContainer = ref(null)
const isDrawing = ref(false)
const showResult = ref(false)
const winner = ref('')
let radius = 150
let dtr = Math.PI/180
let d = 300
let mcList = []
let active = false
let lasta = 1
let lastb = 1
let distr = true
let tspeed = 5
let baseSpeed = 0.05
let size = 250
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

// 模拟参与者数据
const participants = [
  '张三', '李四', '王五', '赵六', '钱七', '孙八', 
  '周九', '吴十', '郑十一', '王十二', '李十三', 
  '刘十四', '陈十五', '杨十六', '黄十七', '赵十八'
]

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
  let t = oDiv.offsetHeight / 2

  for (let i = 0; i < mcList.length; i++) {
    if (mcList[i].alpha > 0.1) {
      let item = aA[i]
      item.style.left = mcList[i].cx + l - item.offsetWidth/2 + 'px'
      item.style.top = mcList[i].cy + t - item.offsetHeight/2 + 'px'
      item.style.fontSize = Math.ceil(12 * mcList[i].scale/2) + 8 + 'px'
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
  isDrawing.value = true
  tspeed = 15
  baseSpeed = 0.2
}

const stopDraw = () => {
  isDrawing.value = false
  tspeed = 5
  baseSpeed = 0.05
  // 随机选择获奖者
  const randomIndex = Math.floor(Math.random() * participants.length)
  winner.value = participants[randomIndex]
  showResult.value = true
}

onMounted(() => {
  // 创建标签
  participants.forEach(name => {
    const span = document.createElement('span')
    span.textContent = name
    span.style.position = 'absolute'
    span.style.cursor = 'pointer'
    tagCloudContainer.value.appendChild(span)
  })
  
  initTags()
})

onBeforeUnmount(() => {
  // 清理工作
  if (intervalId) {
    clearInterval(intervalId)
  }
  if (tagCloudContainer.value) {
    tagCloudContainer.value.innerHTML = ''
  }
})
</script>

<style scoped>
.spec-draw {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.draw-container {
  height: 100%;
  flex: 1;
}

.draw-area {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #fff;
  border: none;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
}

.card-title-wrapper {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.title-section {
  display: flex;
  align-items: center;
  gap: 16px;
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
  min-height: 400px;
  background: linear-gradient(135deg, #fff5f5 0%, #fff1f0 100%);
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 24px;
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(255, 77, 79, 0.1);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.tag-cloud-container {
  width: 100%;
  height: 400px;
  position: relative;
  color: #ff4d4f;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tag-cloud-container span {
  color: #ff4d4f;
  font-weight: bold;
  transition: all 0.3s ease;
  position: absolute;
  text-shadow: 1px 1px 5px rgba(255, 77, 79, 0.2);
}

.tag-cloud-container span:hover {
  color: #ff7875;
  text-shadow: 2px 2px 8px rgba(255, 77, 79, 0.4);
  transform: scale(1.1);
}

.controls {
  margin-top: 24px;
  display: flex;
  gap: 16px;
  z-index: 100;
}

.result-content {
  text-align: center;
  padding: 24px;
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
  margin: 0 8px;
}

:deep(.ant-card-body) {
  flex: 1;
  overflow: auto;
  padding: 16px;
}
</style>
