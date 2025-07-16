# GitHub Pages 部署问题排查指南

## 🚨 当前问题
访问 `https://tian-sun.github.io/JMA-Voting/trend/` 返回 404 错误，说明 GitHub Pages 没有正确部署 Next.js 构建的静态文件。

## 🔍 问题诊断

从 curl 响应可以看出，GitHub Pages 正在使用 Jekyll 处理你的仓库，而不是使用我们构建的静态文件。这表明：

1. **GitHub Pages 设置错误** - 可能设置为从 main 分支部署，而不是 gh-pages 分支
2. **GitHub Actions 没有运行** - 自动部署流程可能没有执行
3. **部署权限问题** - Actions 可能没有权限推送到 gh-pages 分支

## 🛠️ 解决步骤

### 步骤 1: 检查 GitHub Pages 设置
1. 进入你的 GitHub 仓库
2. 点击 **Settings** 标签
3. 在左侧菜单找到 **Pages**
4. 确保设置如下：
   ```
   Source: Deploy from a branch
   Branch: gh-pages / (root)
   ```
   **如果当前设置是 main 分支，请改为 gh-pages**

### 步骤 2: 检查 GitHub Actions 状态
1. 在仓库中点击 **Actions** 标签
2. 查看是否有 "FanFever Data Collection" 工作流
3. 检查最近的运行状态：
   - ✅ 成功：绿色勾号
   - ❌ 失败：红色 X
   - ⏸️ 未运行：灰色圆点

### 步骤 3: 手动触发部署
如果 Actions 没有运行，手动触发：
1. 在 **Actions** 页面
2. 点击 "FanFever Data Collection" 工作流
3. 点击 **Run workflow** 按钮
4. 设置参数：
   - stage: `first`
   - force_collection: `true` ✅
5. 点击 **Run workflow**

### 步骤 4: 检查权限设置
确保 GitHub Actions 有正确的权限：
1. 进入 **Settings** > **Actions** > **General**
2. 在 "Workflow permissions" 部分选择：
   ```
   Read and write permissions ✅
   Allow GitHub Actions to create and approve pull requests ✅
   ```

### 步骤 5: 验证 gh-pages 分支
检查是否存在 gh-pages 分支：
1. 在仓库主页，点击分支下拉菜单
2. 查看是否有 `gh-pages` 分支
3. 如果存在，点击进入查看是否有构建的文件

## 🚀 快速修复方案

如果上述步骤都正确但仍有问题，尝试以下快速修复：

### 方案 A: 手动部署
```bash
# 在本地运行
npm run build
npm run deploy
```

### 方案 B: 强制重新部署
1. 删除 gh-pages 分支（如果存在）
2. 重新运行 GitHub Actions
3. 等待新的 gh-pages 分支创建

### 方案 C: 检查 .nojekyll 文件
确保部署的文件中包含 `.nojekyll` 文件来禁用 Jekyll：
1. 访问 `https://tian-sun.github.io/JMA-Voting/.nojekyll`
2. 如果返回 404，说明文件缺失

## 🔧 常见问题解答

### Q: 为什么显示 Jekyll 页面而不是 Next.js 应用？
A: GitHub Pages 默认使用 Jekyll 处理仓库。需要：
- 设置从 gh-pages 分支部署
- 确保 .nojekyll 文件存在

### Q: GitHub Actions 显示成功但页面仍是 404？
A: 检查：
- Pages 设置是否指向正确分支
- gh-pages 分支是否包含正确文件
- 是否有缓存问题（等待几分钟）

### Q: 如何确认部署是否成功？
A: 检查以下 URL：
- `https://tian-sun.github.io/JMA-Voting/` - 应该显示 Next.js 应用
- `https://tian-sun.github.io/JMA-Voting/dashboard/` - 应该正常访问
- `https://tian-sun.github.io/JMA-Voting/_next/` - 应该有 JS/CSS 文件

## 📞 需要帮助？

如果问题仍然存在，请提供以下信息：
1. GitHub Pages 设置截图
2. 最近的 GitHub Actions 运行日志
3. gh-pages 分支的文件列表
4. 任何错误消息

## 🎯 预期结果

修复后，以下 URL 都应该正常工作：
- https://tian-sun.github.io/JMA-Voting/
- https://tian-sun.github.io/JMA-Voting/dashboard/
- https://tian-sun.github.io/JMA-Voting/trend/
- https://tian-sun.github.io/JMA-Voting/heat/