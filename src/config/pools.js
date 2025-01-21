// 默认惩罚池配置
export const defaultPunishmentPool = {
  name: '默认惩罚池',
  // 抽取数量的概率配置
  drawCountProbability: [
    { count: 0, probability: 0.7 },
    { count: 1, probability: 0.3 }
  ],
  // 惩罚项目
  items: [
    { id: 'p1', name: '读绕口令【施氏食狮子】' },
    { id: 'p2', name: '跟黄总对视，谁先破防喜提一杯' },
    { id: 'p3', name: '举杯同庆，和坐位左右两边的人干一杯' },
    { id: 'p4', name: '跟抽取的人喝酒' },
    { id: 'p5', name: '给大家发红包' },
    { id: 'p6', name: '找两个人陪喝' },
    { id: 'p7', name: '现场找一个人喝酒，自己不喝' },
    { id: 'p8', name: '顶橘子回座位' }
  ]
}

// 特殊惩罚池配置
export const specialPunishmentPools = [
  {
    id: 'special1',
    name: '惩罚池1',
    // 指定使用这个惩罚池的人员名单
    participants: ['陈兴'],
    // 抽取数量的概率配置
    drawCountProbability: [
      { count: 1, probability: 1 }
    ],
    // 惩罚项目
    items: [
      { id: 'sp1-1', name: '没收烟，去找会场外的陌生人讨1根烟回来给奚老板' }
    ]
  },
  {
    id: 'special2',
    name: '惩罚池2',
    // 指定使用这个惩罚池的人员名单
    participants: ['李丽', '华云芳', '戴舻勇'],
    // 抽取数量的概率配置
    drawCountProbability: [
      { count: 1, probability: 1 },
    ],
    // 惩罚项目
    items: [
      { id: 'sp2-1', name: '唱一首歌曲或喝一瓶' }
    ]
  },
  {
    id: 'special3',
    name: '惩罚池3',
    // 指定使用这个惩罚池的人员名单
    participants: ['沈晓伟', '夏欢欢', '傅宇成', '赵碧峰', '罗向利', '姚杰', '汪毅', '李鹏飞', '许琦', '韩建锋'],
    // 抽取数量的概率配置
    drawCountProbability: [
      { count: 1, probability: 1 },
    ],
    // 惩罚项目
    items: [
      { id: 'p9', name: '读绕口令【施氏食狮子】' },
      { id: 'p10', name: '跟黄总对视，谁先破防喜提一杯' },
      { id: 'p11', name: '跟抽取的人喝酒' },
      { id: 'p12', name: '给大家发红包' },
      { id: 'p13', name: '找两个人陪喝' },
      { id: 'p14', name: '现场找一个人喝酒，自己不喝' },
      { id: 'p15', name: '顶橘子回座位，掉了喝酒/发红包' }
    ]
  }
]

// 默认奖励池配置
export const defaultRewardPool = {
  id: 1,
  name: '奖励池A',
  items: [
    { id: 'r1-1', name: '小米破壁机', count: 2 },
    { id: 'r1-2', name: '机械日历', count: 2 },
    { id: 'r1-3', name: '户外茶具包', count: 3 },
    { id: 'r1-4', name: '除螨仪', count: 3 },
    { id: 'r1-5', name: '壁炉香薰加湿器', count: 3 },
    { id: 'r1-6', name: '复古蓝牙音箱', count: 2 },
    { id: 'r1-7', name: '车载吸尘器', count: 4 },
    { id: 'r1-8', name: '香薰蜡烛', count: 6 },
    { id: 'r1-9', name: '蛇年商务礼盒', count: 7 },
    { id: 'r1-10', name: '小天鹅迷你洗衣机', count: 6 },
    { id: 'r1-11', name: '超声波清洗机', count: 2 },
    { id: 'r1-12', name: '无线鼠标', count: 4 },
    { id: 'r1-13', name: '机械键盘', count: 3 },
    { id: 'r1-14', name: '移动硬盘', count: 2 },
    { id: 'r1-15', name: '京东E卡', count: 2 }
  ]
}

// 特殊奖励池配置
export const specialRewardPools = [
  {
    id: 2,
    name: '奖励池B',
    participants: [
      '胡希鹏'
    ],
    items: [
      { id: 'r1-16', name: '小米破壁机', count: 1 }
    ]
  },
  {
    id: 3,
    name: '奖励池C',
    participants: [
      '李存考'
    ],
    items: [
      { id: 'r1-17', name: '移动硬盘', count: 1 }
    ]
  },
  {
    id: 4,
    name: '奖励池D',
    participants: [
      '黄建清'
    ],
    items: [
      { id: 'r1-18', name: '机械日历', count: 1 }
    ]
  }
]

// 年终大奖候选人名单
export const annualAwardPool = {
  name: '年终大奖池',
  participants: [
    '冯旭阳',
    '杨梦',
    '余燕双',
    '任道艳',
    '夏欢欢',
    '李茜茜',
    '余凯宁'
  ]
}

// 工具函数：根据概率数组随机选择一个数量
export function getRandomCountByProbability(probabilities) {
  const random = Math.random()
  let sum = 0
  
  for (const item of probabilities) {
    sum += item.probability
    if (random < sum) {
      return item.count
    }
  }
  
  // 如果概率和不为1，返回最后一个选项
  return probabilities[probabilities.length - 1].count
}

// 工具函数：获取人员对应的惩罚池
export function getPersonPunishmentPool(personName) {
  // 查找人员是否在特殊惩罚池中
  const specialPool = specialPunishmentPools.find(pool => 
    pool.participants.includes(personName)
  )
  
  // 如果找到特殊池，返回特殊池，否则返回默认池
  return specialPool || defaultPunishmentPool
}

// 工具函数：获取人员对应的奖励池
export function getPersonRewardPool(personName) {
  // 查找人员是否在特殊奖励池中
  const specialPool = specialRewardPools.find(pool => 
    pool.participants.includes(personName)
  )
  
  // 如果找到特殊池，返回特殊池，否则返回默认池
  return specialPool || defaultRewardPool
} 