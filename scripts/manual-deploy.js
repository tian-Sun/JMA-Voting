const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

// 手动部署脚本
function manualDeploy() {
  console.log('🚀 开始手动部署到 GitHub Pages...')
  
  try {
    // 1. 检查是否在正确的目录
    const packagePath = path.join(process.cwd(), 'package.json')
    if (!fs.existsSync(packagePath)) {
      throw new Error('请在项目根目录运行此脚本')
    }
    
    // 2. 检查 git 状态
    console.log('📋 检查 git 状态...')
    try {
      const status = execSync('git status --porcelain', { encoding: 'utf8' })
      if (status.trim()) {
        console.log('⚠️  有未提交的更改，建议先提交：')
        console.log(status)
        console.log('继续部署...')
      }
    } catch (error) {
      console.log('⚠️  无法检查 git 状态，继续部署...')
    }
    
    // 3. 安装依赖
    console.log('📦 检查依赖...')
    if (!fs.existsSync('node_modules')) {
      console.log('安装依赖...')
      execSync('npm install', { stdio: 'inherit' })
    }
    
    // 4. 构建项目
    console.log('🔨 构建项目...')
    execSync('npm run build', { stdio: 'inherit' })
    
    // 5. 验证构建结果
    console.log('🔍 验证构建结果...')
    const outDir = path.join(process.cwd(), 'out')
    const requiredFiles = [
      'index.html',
      '404.html',
      '.nojekyll',
      'dashboard/index.html',
      'trend/index.html',
      'heat/index.html'
    ]
    
    let allFilesExist = true
    requiredFiles.forEach(file => {
      const filePath = path.join(outDir, file)
      if (fs.existsSync(filePath)) {
        console.log(`✅ ${file}`)
      } else {
        console.log(`❌ ${file} - 缺失`)
        allFilesExist = false
      }
    })
    
    if (!allFilesExist) {
      throw new Error('构建文件不完整，请检查构建过程')
    }
    
    // 6. 部署到 GitHub Pages
    console.log('🚀 部署到 GitHub Pages...')
    execSync('npx gh-pages -d out', { stdio: 'inherit' })
    
    console.log('✅ 部署完成！')
    console.log('')
    console.log('📝 接下来的步骤：')
    console.log('1. 等待 2-3 分钟让 GitHub Pages 更新')
    console.log('2. 检查 GitHub Pages 设置：')
    console.log('   - Settings > Pages')
    console.log('   - Source: Deploy from a branch')
    console.log('   - Branch: gh-pages / (root)')
    console.log('3. 访问以下 URL 验证：')
    console.log('   - https://tian-sun.github.io/JMA-Voting/')
    console.log('   - https://tian-sun.github.io/JMA-Voting/dashboard/')
    console.log('   - https://tian-sun.github.io/JMA-Voting/trend/')
    console.log('   - https://tian-sun.github.io/JMA-Voting/heat/')
    
  } catch (error) {
    console.error('❌ 部署失败:', error.message)
    console.log('')
    console.log('🔧 故障排除建议：')
    console.log('1. 确保已安装 gh-pages: npm install -g gh-pages')
    console.log('2. 确保有 git 推送权限')
    console.log('3. 检查网络连接')
    console.log('4. 查看完整错误信息')
    process.exit(1)
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  manualDeploy()
}

module.exports = manualDeploy