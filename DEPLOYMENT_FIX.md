# GitHub Pages 部署修复指南

## 问题描述
项目在 GitHub Pages 上部署后，只能访问首页，其他页面（/dashboard, /trend, /heat）返回 404 错误。

## 问题原因
这是 Next.js App Router 在静态导出到 GitHub Pages 时的常见问题：
1. GitHub Pages 不支持服务端路由
2. 缺少客户端路由的 404 处理
3. basePath 配置不正确

## 修复方案

### 1. 更新 Next.js 配置 (next.config.js)
```javascript
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  skipTrailingSlashRedirect: true,
  distDir: 'out',
  basePath: process.env.NODE_ENV === 'production' ? '/JMA-Voting' : '',
  assetPrefix: process.env.NODE_ENV === 'production' ? '/JMA-Voting' : '',
  images: {
    unoptimized: true
  },
  generateStaticParams: true,
}
```

### 2. 创建 404 处理页面 (app/not-found.tsx)
- 处理客户端路由重定向
- 自动导航到正确的页面

### 3. 构建后处理脚本 (scripts/post-build.js)
- 复制 index.html 为 404.html
- 创建 .nojekyll 文件
- 验证构建输出

### 4. 更新部署脚本
```json
{
  "scripts": {
    "build": "next build && node scripts/post-build.js",
    "deploy": "npm run build && npx gh-pages -d out",
    "test-build": "node scripts/test-build.js"
  }
}
```

## 部署步骤

### 本地测试
```bash
# 1. 测试构建
npm run test-build

# 2. 如果测试通过，提交更改
git add .
git commit -m "fix: GitHub Pages routing issues"
git push
```

### GitHub Actions 部署
1. 推送代码到 GitHub
2. 手动触发 Actions 工作流，或等待定时任务
3. 检查 GitHub Pages 设置：
   - Settings > Pages
   - Source: Deploy from a branch
   - Branch: gh-pages / (root)

### 验证部署
访问以下 URL 确认页面正常：
- https://[username].github.io/JMA-Voting/
- https://[username].github.io/JMA-Voting/dashboard/
- https://[username].github.io/JMA-Voting/trend/
- https://[username].github.io/JMA-Voting/heat/

## 常见问题

### Q: 页面仍然显示 404
A: 检查 GitHub Pages 设置，确保从 gh-pages 分支部署

### Q: 样式或资源加载失败
A: 检查 basePath 和 assetPrefix 配置是否正确

### Q: 数据加载失败
A: 确保数据文件正确复制到 out 目录

## 技术说明

### 为什么需要 404.html？
GitHub Pages 在找不到页面时会显示 404.html，我们利用这个机制来处理客户端路由。

### 为什么需要 .nojekyll？
GitHub Pages 默认使用 Jekyll 处理，会忽略下划线开头的文件（如 _next），添加 .nojekyll 可以禁用 Jekyll。

### basePath 的作用
GitHub Pages 项目页面的 URL 格式是 `username.github.io/repository-name`，basePath 确保所有资源路径正确。