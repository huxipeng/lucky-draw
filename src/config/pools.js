// 默认惩罚池配置
export const defaultPunishmentPool = {
  name: '默认惩罚池',
  // 抽取数量的概率配置
  drawCountProbability: [
    { count: 0, probability: 0.3 },
    { count: 1, probability: 0.3 },
    { count: 2, probability: 0.3 },
    { count: 3, probability: 0.1 }
  ],
  // 惩罚项目
  items: [
    { id: 'p1', name: '唱一首歌' },
    { id: 'p2', name: '跳一段舞' },
    { id: 'p3', name: '讲一个笑话' },
    { id: 'p4', name: '做一个鬼脸' },
    { id: 'p5', name: '俯卧撑10个' },
    { id: 'p6', name: '仰卧起坐20个' },
    { id: 'p7', name: '深蹲15个' },
    { id: 'p8', name: '原地跳绳30下' },
    { id: 'p9', name: '给大家讲一个工作趣事' },
    { id: 'p10', name: '模仿一个电影桥段' },
    { id: 'p11', name: '用方言说一句话' },
    { id: 'p12', name: '即兴演讲一分钟' }
  ]
}

// 特殊惩罚池配置
export const specialPunishmentPools = [
  {
    id: 'special1',
    name: '领导专属惩罚池',
    // 指定使用这个惩罚池的人员名单
    participants: ['奚泳利', '黄建清', '李存考'],
    // 抽取数量的概率配置
    drawCountProbability: [
      { count: 0, probability: 0.4 },
      { count: 1, probability: 0.4 },
      { count: 2, probability: 0.2 }
    ],
    // 惩罚项目
    items: [
      { id: 'sp1-1', name: '给团队成员发红包' },
      { id: 'sp1-2', name: '请大家喝咖啡' },
      { id: 'sp1-3', name: '分享一个管理经验' },
      { id: 'sp1-4', name: '给团队讲一个笑话' }
    ]
  },
  {
    id: 'special2',
    name: '新员工惩罚池',
    participants: ['周科', '梁世辉', '栾兴华'],
    drawCountProbability: [
      { count: 1, probability: 0.6 },
      { count: 2, probability: 0.4 }
    ],
    items: [
      { id: 'sp2-1', name: '分享入职感受' },
      { id: 'sp2-2', name: '展示一个特长' },
      { id: 'sp2-3', name: '介绍家乡特产' },
      { id: 'sp2-4', name: '表演才艺' }
    ]
  }
]

// 奖励池配置
export const rewardPools = [
  {
    id: 1,
    name: '奖励池A',
    items: [
      { id: 'r1-1', name: '小米破壁机', count: 2 },
      { id: 'r1-2', name: '机械日历', count: 3 },
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
      { id: 'r1-14', name: '移动硬盘', count: 3 }
    ]
  },
  {
    id: 2,
    name: '奖励池B',
    items: [
      { id: 'r1-15', name: '小米破壁机', count: 1 }
    ]
  }
]

// 人员奖励池映射关系
export const personRewardPoolMap = {
  // 前22人对应奖励池A
  '奚泳利': 1, '黄建清': 1, '李存考': 1, '黄建平': 1, '胡希鹏': 1,
  '沈晓伟': 1, '冯旭阳': 1, '傅宇成': 1, '杨梦': 1, '余燕双': 1,
  '任道艳': 1, '夏欢欢': 1, '姚杰': 1, '李茜茜': 1, '华云芳': 1,
  '郑华': 1, '王伟龙': 1, '朱宏林': 1, '余凯宁': 1, '雷锦': 1,
  '吴丽亮': 1, '韩建锋': 1,
  
  // 后23人对应奖励池B
  '李梦秋': 2, '杨佳雪': 2, '徐振栋': 2, '周禹豪': 2, '陈兴': 2,
  '于魁星': 2, '周峰': 2, '罗向利': 2, '赵碧峰': 2, '姜凯鑫': 2,
  '徐德禄': 2, '刘伟': 2, '毛宏振': 2, '刘丽丽': 2, '虞秀芳': 2,
  '孔庆友': 2, '王学凡': 2, '任勇': 2, '张玲峰': 2, '宁飞': 2,
  '周科': 2, '梁世辉': 2, '栾兴华': 2
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