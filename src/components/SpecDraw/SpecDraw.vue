<template>
  <!-- 添加彩花容器到body -->
  <teleport to="body">
    <div v-if="showResult" class="confetti-container">
      <div v-for="n in 100" :key="n" class="confetti" :style="getConfettiStyle(n)"></div>
    </div>
  </teleport>
  
  <div class="spec-draw">
    <!-- 添加开始动画 -->
    <div v-if="showStartAnimation" class="start-animation-container">
      <div class="start-text">即将开始</div>
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
              width="1200px"
              class="result-modal"
            >
              <div class="result-content">
                <!-- 使用新的header图片 -->
                <div class="result-header">
                  <img src="@/assets/spec-draw-header.png" alt="年终大奖" class="header-image"/>
                </div>
                <!-- 获奖者信息 -->
                <div class="winner-info">
                  <div class="winner-text">恭喜 <span class="winner-name">{{ winner }}</span> 获得年终大奖</div>
                </div>
                <!-- 使用新的footer图片 -->
                <div class="result-footer">
                  <img src="@/assets/spec-draw-footer.png" alt="奖品信息" class="footer-image"/>
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

// 路由实例
const router = useRouter()

// 响应式状态变量
const tagCloudContainer = ref(null)      // 3D标签云容器引用
const isDrawing = ref(false)             // 是否正在抽奖
const showResult = ref(false)            // 是否显示结果弹窗
const winner = ref('')                   // 中奖者姓名
const showCountdown = ref(false)         // 是否显示倒计时
const countdown = ref(10)                // 倒计时数值
const showStartAnimation = ref(false)    // 是否显示开始动画

// 3D球体相关参数
let radius = 350                         // 球体半径
let dtr = Math.PI/180                    // 角度转弧度系数
let d = 500                             // 视距
let mcList = []                         // 存储标签位置信息的数组
let active = false                      // 是否处于鼠标操控状态
let lasta = 1                           // 上一次的水平旋转角度
let lastb = 1                           // 上一次的垂直旋转角度
let distr = true                        // 是否均匀分布标签
let tspeed = 2                          // 旋转速度
let baseSpeed = 0.02                    // 基础旋转速度
let size = 450                          // 球体大小
let mouseX = 0                          // 鼠标X坐标
let mouseY = 0                          // 鼠标Y坐标
let howElliptical = 1                   // 球体椭圆度

// DOM元素引用
let aA = null                           // 存储所有标签元素的数组
let oDiv = null                         // 标签云容器DOM元素

// 旋转计算相关变量
let sa = 0                              // sin(a)
let ca = 0                              // cos(a)
let sb = 0                              // sin(b)
let cb = 0                              // cos(b)
let sc = 0                              // sin(c)
let cc = 0                              // cos(c)

// 定时器引用
let intervalId = null                   // 更新位置的定时器
let autoRotateInterval = null           // 自动旋转的定时器
let drawTimer = null                    // 抽奖动画定时器

// 旋转状态
let rotationX = 0                       // X轴旋转角度
let rotationY = 0                       // Y轴旋转角度
let rotationZ = 0                       // Z轴旋转角度
let rotationDirection = { x: 1, y: 1, z: 1 }  // 旋转方向

// 跳转到普通抽奖页面
const goToLuckyDraw = () => {
  router.push('/')
}

// 更新3D球体的位置和状态
const update = () => {
  let a
  let b

  // 根据是否处于鼠标控制状态计算旋转角度
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

  // 更新每个标签的3D位置
  for (let j = 0; j < mcList.length; j++) {
    // 第一次旋转变换
    let rx1 = mcList[j].cx
    let ry1 = mcList[j].cy * ca + mcList[j].cz * (-sa)
    let rz1 = mcList[j].cy * sa + mcList[j].cz * ca

    // 第二次旋转变换
    let rx2 = rx1 * cb + rz1 * sb
    let ry2 = ry1
    let rz2 = rx1 * (-sb) + rz1 * cb

    // 第三次旋转变换
    let rx3 = rx2 * cc + ry2 * (-sc)
    let ry3 = rx2 * sc + ry2 * cc
    let rz3 = rz2

    // 更新标签的3D坐标
    mcList[j].cx = rx3
    mcList[j].cy = ry3
    mcList[j].cz = rz3

    // 计算透视效果
    let per = d / (d + rz3)

    // 更新标签的2D投影位置和缩放比例
    mcList[j].x = (howElliptical * rx3 * per) - (howElliptical * 2)
    mcList[j].y = ry3 * per
    mcList[j].scale = per
    mcList[j].alpha = per

    // 调整透明度
    mcList[j].alpha = (mcList[j].alpha - 0.6) * (10/6)
  }

  // 更新DOM位置并进行深度排序
  doPosition()
  depthSort()
}

// 计算三角函数值
const sineCosine = (a, b, c) => {
  sa = Math.sin(a * dtr)
  ca = Math.cos(a * dtr)
  sb = Math.sin(b * dtr)
  cb = Math.cos(b * dtr)
  sc = Math.sin(c * dtr)
  cc = Math.cos(c * dtr)
}

// 根据Z轴深度对标签进行排序
const depthSort = () => {
  let aTmp = []

  // 复制标签数组
  for (let i=0; i<aA.length; i++) {
    aTmp.push(aA[i])
  }

  // 根据z坐标进行排序
  aTmp.sort(function (vItem1, vItem2) {
    if (vItem1.cz > vItem2.cz) {
      return -1
    } else if (vItem1.cz < vItem2.cz) {
      return 1
    } else {
      return 0
    }
  })

  // 更新标签的z-index
  for (let i=0; i<aTmp.length; i++) {
    aTmp[i].style.zIndex = i
  }
}

// 初始化标签的3D位置
const positionAll = () => {
  let phi = 0
  let theta = 0
  let max = mcList.length
  let i = 0

  // 随机打乱标签顺序
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

  // 计算每个标签的3D坐标
  for (let i = 1; i < max + 1; i++) {
    if (distr) {
      // 均匀分布在球面上
      phi = Math.acos(-1 + (2 * i - 1) / max)
      theta = Math.sqrt(max * Math.PI) * phi
    } else {
      // 随机分布在球面上
      phi = Math.random() * (Math.PI)
      theta = Math.random() * (2 * Math.PI)
    }

    // 将球面坐标转换为笛卡尔坐标
    mcList[i - 1].cx = radius * Math.cos(theta) * Math.sin(phi)
    mcList[i - 1].cy = radius * Math.sin(theta) * Math.sin(phi)
    mcList[i - 1].cz = radius * Math.cos(phi)
  }
}

// 更新标签的DOM位置
const doPosition = () => {
  let l = oDiv.offsetWidth / 2
  let t = oDiv.offsetHeight / 2 - 40

  // 更新每个标签的位置和样式
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

// 初始化标签云
const initTags = () => {
  // 获取DOM元素
  oDiv = tagCloudContainer.value
  aA = oDiv.getElementsByTagName('span')

  // 初始化标签位置信息
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

  // 初始化三角函数值和位置
  sineCosine(0, 0, 0)
  positionAll()
  
  // 添加鼠标事件监听
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

  // 启动位置更新定时器
  if (intervalId) {
    clearInterval(intervalId)
  }
  intervalId = setInterval(update, 30)
}

// 开始抽奖流程
const startDraw = () => {
  // 防止重复点击
  if (isDrawing.value) return
  isDrawing.value = true
  
  // 显示开始动画
  showStartAnimation.value = true
  
  // 5秒后隐藏开始动画并开始抽奖
  setTimeout(() => {
    showStartAnimation.value = false
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
  }, 5000)
}

// 停止抽奖并显示结果
const stopDraw = () => {
  isDrawing.value = false
  showCountdown.value = false
  countdown.value = 10
  tspeed = 2
  baseSpeed = 0.02
  
  // 从年终大奖池中随机抽取获奖者
  const random = Math.random() * annualAwardPool.participants.length
  const randomIndex = Math.floor(random)
  winner.value = annualAwardPool.participants[randomIndex]
  showResult.value = true
}

// 生成彩花样式
const getConfettiStyle = (n) => {
  const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min
  const colors = [
    '#ff4d4f', '#ff7875', '#ffa39e', '#ffccc7', '#fff1f0',
    '#ffd666', '#ffc53d', '#fadb14', /* 金色 */
    '#95de64', '#73d13d', '#389e0d', /* 绿色 */
    '#40a9ff', '#1890ff', '#096dd9'  /* 蓝色 */
  ]
  
  // 随机决定是从左边还是右边发射
  const isLeft = n % 2 === 0
  const side = isLeft ? 'left' : 'right'
  
  // 返回随机样式属性
  return {
    '--rotation': `${rand(-30, 30)}deg`,
    '--animation-delay': `${(n * 0.05)}s`, /* 减小延迟使彩花更密集 */
    '--hue': colors[Math.floor(Math.random() * colors.length)],
    '--throw-height': `${rand(-500, -800)}px`, /* 增加抛洒高度 */
    '--throw-distance': isLeft ? `${rand(800, 1200)}px` : `${rand(-1200, -800)}px`, /* 增加水平距离 */
    [side]: '0%', /* 从屏幕边缘开始 */
    bottom: `${rand(-50, 200)}px`, /* 增加起始位置的随机性 */
    width: `${rand(15, 25)}px`, /* 彩花尺寸 */
    height: `${rand(30, 50)}px` /* 彩花尺寸 */
  }
}

// 组件挂载时的初始化
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

// 组件卸载时的清理
onBeforeUnmount(() => {
  // 清除所有定时器
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
  color: #9c27b0;  /* 修改为淡紫色 */
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
  color: #9c27b0;  /* 修改为淡紫色 */
  font-weight: bold;
  transition: all 0.3s ease;
  position: absolute;
  text-shadow: 2px 2px 8px rgba(156, 39, 176, 0.2);  /* 修改阴影颜色为淡紫色 */
  font-size: 24px !important;
  pointer-events: auto;
}

.tag-cloud-container span:hover {
  color: #7b1fa2;  /* 修改悬停颜色为更深的淡紫色 */
  text-shadow: 4px 4px 12px rgba(156, 39, 176, 0.3);  /* 修改悬停阴影为淡紫色 */
  transform: scale(1.2);
}

.result-modal {
  :deep(.ant-modal-wrap),
  :deep(.ant-modal-mask) {
    z-index: 1900;  /* 弹窗遮罩层级 */
  }
  
  :deep(.ant-modal) {
    z-index: 1900;  /* 弹窗本身层级 */
  }

  :deep(.ant-modal-content) {
    background: #fff;
    border-radius: 20px;
    overflow: hidden;
    position: relative;
    padding: 0;
  }
}

.result-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 30px;
  text-align: center;
  position: relative;
}

/* header图片样式 */
.header-image {
  width: 100%;
  max-width: 500px;
  height: auto;
  margin-bottom: 40px;
}

/* 获奖者信息样式 */
.winner-info {
  margin: 40px 0;
}

.winner-text {
  font-size: 36px;
  color: #333;
  font-weight: bold;
}

.winner-name {
  color: #ff4d4f;
  font-size: 40px;
  margin: 0 10px;
}

/* footer图片样式 */
.footer-image {
  width: 100%;
  max-width: 800px;
  height: auto;
  margin-top: 20px;
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

/* 修改彩花样式 */
.confetti-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  pointer-events: none;
  z-index: 9999999 !important;
}

.confetti {
  position: absolute;
  background: var(--hue);
  width: var(--width);
  height: var(--height);
  transform: rotate(var(--rotation));
  opacity: 0;
  animation: confetti-throw 3s cubic-bezier(0.05, 0.95, 0.35, 0.95) infinite; /* 增加动画时长 */
  animation-delay: var(--animation-delay);
  border-radius: 4px; /* 增加圆角 */
  box-shadow: 0 0 15px rgba(0, 0, 0, 0.3); /* 增强阴影 */
}

@keyframes confetti-throw {
  0% {
    opacity: 1;
    transform: 
      translateX(0)
      translateY(0)
      rotate(var(--rotation));
  }
  35% { /* 提前到达最高点 */
    opacity: 1;
    transform: 
      translateX(var(--throw-distance))
      translateY(var(--throw-height))
      rotate(calc(var(--rotation) + 180deg));
  }
  100% {
    opacity: 0;
    transform: 
      translateX(var(--throw-distance))
      translateY(calc(var(--throw-height) * -0.2)) /* 调整落点高度，使其落得更慢 */
      rotate(calc(var(--rotation) + 360deg));
  }
}

/* 开始动画样式 */
.start-animation-container {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1002;
  animation: fade-in-out 5s ease-in-out forwards;
}

.start-text {
  font-size: 160px;
  font-weight: bold;
  color: #ff4d4f;
  text-shadow: 0 0 50px rgba(255, 77, 79, 0.8);
  animation: start-text-animation 5s ease-in-out forwards;
  -webkit-text-stroke: 4px #fff;
  background: linear-gradient(45deg, #ff4d4f, #ffd666);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  letter-spacing: 20px;
  transform: scale(0);
}

@keyframes fade-in-out {
  0% {
    background: rgba(0, 0, 0, 0);
  }
  50% {
    background: rgba(0, 0, 0, 0.5);
  }
  100% {
    background: rgba(0, 0, 0, 0);
  }
}

@keyframes start-text-animation {
  0% {
    transform: scale(0) rotate(-180deg);
    opacity: 0;
  }
  20%, 80% {
    transform: scale(1.2) rotate(0deg);
    opacity: 1;
  }
  100% {
    transform: scale(0) rotate(180deg);
    opacity: 0;
  }
}
</style>
