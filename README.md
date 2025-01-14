# 年会抽奖助手

一个基于 Vue 3 + Ant Design Vue 开发的年会抽奖系统。

## 功能特点

- 🎯 完全随机的抽奖流程
- 👥 支持配置参与人员名单
- 🎁 预设多个奖项等级
- 🔄 动态滚动抽奖效果
- 📊 实时显示剩余奖项和待抽奖人数
- 📝 完整的中奖记录
- 🚫 防止重复中奖
- ⏱️ 支持自动停止功能（5秒）

## 技术栈

- Vue 3
- Ant Design Vue 4.x
- Pinia 状态管理
- Composition API

## 快速开始

### 安装依赖

```bash
yarn install
```

### 开发模式运行

```bash
yarn serve
```

### 生产环境构建

```bash
yarn build
```

## 配置说明

### 参与人员配置

编辑 `src/config/participants.js` 文件：

```javascript
export const participants = [
  { id: '1001', name: '张三' },
  { id: '1002', name: '李四' },
  // 添加更多参与者...
]
```

### 奖项配置

编辑 `src/stores/luckyDraw.js` 文件中的 prizes 数组：

```javascript
prizes: [
  { id: 1, name: '特等奖', count: 1, remaining: 1 },
  { id: 2, name: '一等奖', count: 3, remaining: 3 },
  { id: 3, name: '二等奖', count: 5, remaining: 5 },
  { id: 4, name: '三等奖', count: 10, remaining: 10 },
]
```

## 使用说明

1. 抽奖流程
   - 点击"开始抽人"按钮，开始随机抽取人员
   - 5秒后自动停止，或手动点击停止
   - 抽中人员后，点击"开始抽奖"按钮抽取奖项
   - 5秒后自动停止，或手动点击停止
   - 显示中奖结果

2. 其他功能
   - 实时显示待抽奖人数和剩余奖项数量
   - 可以随时重置抽奖
   - 查看完整的中奖记录

## 注意事项

- 每人只能中奖一次
- 每个奖项有数量限制
- 重置功能会清空所有中奖记录
- 建议在大屏幕设备上使用

## 贡献指南

1. Fork 本仓库
2. 创建您的特性分支 (git checkout -b feature/AmazingFeature)
3. 提交您的更改 (git commit -m 'Add some AmazingFeature')
4. 推送到分支 (git push origin feature/AmazingFeature)
5. 打开一个 Pull Request

## License

MIT License
