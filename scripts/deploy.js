const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

// 配置
const config = {
  dataDir: path.join(__dirname, '../public/data'),
  buildDir: path.join(__dirname, '../out'),
}

// 检查是否有数据文件
function checkDataFiles() {
  const manifestPath = path.join(config.dataDir, 'manifest.json')
  if (!fs.existsSync(manifestPath)) {
    throw new Error('没有找到数据清单文件，请先运行数据拉取脚本')
  }
  
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
  const hasData = Object.values(manifest).some(dates => dates.length > 0)
  
  if (!hasData) {
    throw new Error('没有找到任何数据文件，请先运行数据拉取脚本')
  }
  
  console.log('✅ 数据文件检查通过')
  return manifest
}

// 构建静态文件
function buildStaticFiles() {
  console.log('正在构建静态文件...')
  
  try {
    // 清理构建目录
    if (fs.existsSync(config.buildDir)) {
      fs.rmSync(config.buildDir, { recursive: true, force: true })
    }
    
    // 运行构建命令
    execSync('npm run build', { stdio: 'inherit' })
    console.log('✅ 静态文件构建完成')
    
  } catch (error) {
    throw new Error(`构建失败: ${error.message}`)
  }
}

// 部署到GitHub Pages
function deployToGitHubPages() {
  console.log('正在部署到GitHub Pages...')
  
  try {
    // 检查是否有gh-pages分支
    try {
      execSync('git show-ref --verify --quiet refs/remotes/origin/gh-pages', { stdio: 'ignore' })
      console.log('找到gh-pages分支，将更新现有分支')
    } catch (error) {
      console.log('没有找到gh-pages分支，将创建新分支')
    }
    
    // 使用gh-pages包部署
    execSync('npx gh-pages -d out', { stdio: 'inherit' })
    console.log('✅ 部署完成')
    
  } catch (error) {
    throw new Error(`部署失败: ${error.message}`)
  }
}

// 主函数
async function main() {
  try {
    console.log('=== 开始部署到GitHub Pages ===')
    console.log(`时间: ${new Date().toLocaleString('zh-CN')}`)
    console.log('')
    
    // 检查数据文件
    const manifest = checkDataFiles()
    
    // 显示数据信息
    console.log('数据文件信息:')
    Object.entries(manifest).forEach(([stage, dates]) => {
      console.log(`- ${stage}: ${dates.length} 个数据点`)
      if (dates.length > 0) {
        console.log(`  最新: ${dates[dates.length - 1]}`)
      }
    })
    console.log('')
    
    // 构建静态文件
    buildStaticFiles()
    
    // 部署到GitHub Pages
    deployToGitHubPages()
    
    console.log('')
    console.log('=== 部署完成 ===')
    console.log('网站将在几分钟内更新: https://tian-sun.github.io/JMA-Voting/')
    
  } catch (error) {
    console.error('部署失败:', error.message)
    process.exit(1)
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main()
}

module.exports = {
  checkDataFiles,
  buildStaticFiles,
  deployToGitHubPages,
} 