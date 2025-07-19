# FanFever 投票数据看板

一个基于 Next.js + Tailwind CSS 构建的实时投票数据监控看板，支持榜单概览、趋势分析和榜单热度三大核心功能。

## 🎯 项目概述

### 核心功能
- **榜单概览**: Top 75 艺人排行榜，支持阶段切换、分类筛选和关键词搜索
- **趋势分析**: 投票折线图和排名趋势图，支持多艺人对比
- **榜单热度**: 整榜总票数分析、Top 10 占比饼图和黑马榜

### 技术特性
- 🚀 Next.js 14 + App Router
- 🎨 Tailwind CSS + 自定义组件系统
- 📊 ECharts 图表库
- 📱 响应式设计，完美适配移动端
- 🔄 自动化数据获取和部署
- 📈 虚拟滚动优化大数据表格
- 💾 Gzip 数据压缩

## 📁 项目结构

```
JMA-Voting/
├── app/                          # Next.js App Router
│   ├── globals.css              # 全局样式
│   ├── layout.tsx               # 根布局
│   ├── page.tsx                 # 首页（重定向）
│   ├── dashboard/               # 榜单概览
│   │   ├── layout.tsx          
│   │   └── page.tsx            
│   ├── trend/                   # 趋势分析
│   │   ├── layout.tsx          
│   │   └── page.tsx            
│   └── heat/                    # 榜单热度
│       ├── layout.tsx          
│       └── page.tsx            
├── components/                   # 可复用组件
│   └── ui/                     
│       ├── navigation.tsx       # 导航组件
│       ├── card.tsx            # 卡片组件
│       └── loading.tsx         # 加载组件
├── lib/                         # 工具库
│   ├── utils.ts                # 通用工具函数
│   └── data-loader.ts          # 数据加载器
├── types/                       # TypeScript 类型定义
│   └── index.ts                
├── scripts/                     # 脚本
│   └── manual-collect.js       # 手动数据收集脚本
├── public/data/                 # 数据存储目录
│   ├── manifest.json           # 数据清单
│   ├── run-records.json        # 运行记录
│   └── *.json.gz               # 压缩的数据文件
└── public/                      # 静态资源
```

## 🚀 快速开始

### 环境要求
- Node.js 18+
- npm 或 yarn

### 安装依赖
```bash
npm install
```

### 开发模式
```bash
npm run dev
```

### 生产构建
```bash
npm run build
```

## 📊 数据收集

### 手动数据收集命令

项目采用手动数据收集模式，每天需要手动运行一次数据收集命令：

```bash
# 收集第一阶段数据
npm run collect:first

# 收集第二阶段数据  
npm run collect:second

# 收集两个阶段数据
npm run collect:both
```

### 数据收集说明

- **收集频率**: 每天手动运行一次
- **数据存储**: 自动保存到 `public/data/` 目录
- **文件格式**: 压缩的JSON文件 (`.json.gz`)
- **记录追踪**: 自动更新运行记录和manifest文件

### 环境变量配置

在运行数据收集前，请确保设置了正确的API地址：

```bash
# 设置API地址
export FANFEVER_API_URL=https://lite-be.cfanfever.com/api/v1/fanfever

# 然后运行数据收集
npm run collect:first
```

## 🚀 部署

### Vercel部署

1. 连接GitHub仓库到Vercel
2. 设置环境变量 `FANFEVER_API_URL`
3. 自动部署，每次push都会触发重新部署

## 📊 数据格式

### 单日快照数据结构
```typescript
interface DailySnapshot {
  snapshot_date: string        // YYYY-MM-DD
  stage: 'first' | 'second'   // 投票阶段
  categories: {
    [category: string]: Artist[]
  }
}

interface Artist {
  id: string
  name: string
  currentVotes: number
  rankToday: number
  rankYesterday?: number
  rankDelta: number           // 排名变化
  category: string
}
```

### 数据文件命名
- 格式: `YYYY-MM-DD_stage.json.gz`
- 示例: `2025-07-18_first.json.gz`

## 🔄 自动化工作流

### GitHub Actions 配置
- **触发时间**: 每天 12:05 (GMT+8)
- **手动触发**: 支持指定投票阶段
- **数据处理**: 自动压缩、提交、部署

### 工作流程
1. 📥 获取投票数据 (API调用)
2. 🗜️ 数据压缩 (Gzip)
3. 💾 文件保存 (原子操作)
4. 📝 更新数据清单
5. 🚀 自动部署到 GitHub Pages

## 🎨 设计系统

### 色彩方案
- **主色**: `#ef4444` (红色)
- **辅色**: `#64748b` (灰色)
- **成功**: `#22c55e` (绿色)
- **警告**: `#f59e0b` (橙色)

### 组件库
- 卡片组件 (Card)
- 按钮组件 (Button)
- 表格组件 (Table)
- 加载组件 (Loading)
- 导航组件 (Navigation)

## 📱 响应式设计

### 断点设置
- **移动端**: < 768px
- **平板**: 768px - 1024px
- **桌面端**: > 1024px

### 适配特性
- 表格横向滚动
- 导航菜单折叠
- 图表尺寸自适应
- 虚拟滚动优化

## 🔧 配置说明

### Next.js 配置
- 静态导出: `output: 'export'`
- 基础路径: `/JMA-Voting` (GitHub Pages)
- 图片优化: 禁用 (静态导出要求)

### Tailwind 配置
- 自定义颜色主题
- 动画配置
- 响应式断点

## 📈 性能优化

### 数据处理
- Gzip 压缩减少文件大小
- 客户端缓存 (SWR)
- 懒加载图表组件
- 虚拟滚动大列表

### 用户体验
- 加载状态展示
- 错误边界处理
- 防抖搜索输入
- 平滑动画过渡

## 🛠️ 开发指南

### 添加新页面
1. 在 `app/` 下创建新目录
2. 添加 `layout.tsx` 和 `page.tsx`
3. 更新导航配置

### 添加新组件
1. 在 `components/ui/` 下创建组件文件
2. 遵循现有设计系统
3. 添加 TypeScript 类型定义

### 数据接口集成
1. 修改 `scripts/fetchVotes.js` 中的API调用
2. 更新数据类型定义
3. 调整数据处理逻辑

## 📋 待办事项

- [ ] 添加数据导出为 Excel 格式
- [ ] 实现用户偏好设置
- [ ] 添加深色模式支持
- [ ] 集成实时通知功能
- [ ] 优化图表交互体验

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 打开 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🔗 相关链接

- [Next.js 文档](https://nextjs.org/docs)
- [Tailwind CSS 文档](https://tailwindcss.com/docs)
- [ECharts 文档](https://echarts.apache.org/zh/index.html)
- [GitHub Actions 文档](https://docs.github.com/actions)

---

**FanFever Team** © 2025