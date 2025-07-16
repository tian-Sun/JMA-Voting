const fs = require('fs')
const path = require('path')

// 构建后处理脚本，用于修复 GitHub Pages 路由问题
function postBuild() {
  const outDir = path.join(__dirname, '../out')
  
  console.log('开始构建后处理...')
  
  // 1. 复制 index.html 为 404.html 来处理客户端路由
  const indexPath = path.join(outDir, 'index.html')
  const notFoundPath = path.join(outDir, '404.html')
  
  if (fs.existsSync(indexPath)) {
    fs.copyFileSync(indexPath, notFoundPath)
    console.log('✅ 已创建 404.html 用于客户端路由')
  }
  
  // 2. 创建 .nojekyll 文件，防止 GitHub Pages 忽略下划线开头的文件
  const nojekyllPath = path.join(outDir, '.nojekyll')
  fs.writeFileSync(nojekyllPath, '')
  console.log('✅ 已创建 .nojekyll 文件')
  
  // 3. 检查关键文件是否存在
  const criticalFiles = [
    'dashboard/index.html',
    'trend/index.html', 
    'heat/index.html',
    '_next'
  ]
  
  criticalFiles.forEach(file => {
    const filePath = path.join(outDir, file)
    if (fs.existsSync(filePath)) {
      console.log(`✅ ${file} 存在`)
    } else {
      console.warn(`⚠️  ${file} 不存在`)
    }
  })
  
  // 4. 检查数据文件
  const dataDir = path.join(outDir, 'data')
  if (fs.existsSync(dataDir)) {
    const dataFiles = fs.readdirSync(dataDir)
    console.log(`✅ 数据目录存在，包含 ${dataFiles.length} 个文件`)
  } else {
    console.warn('⚠️  数据目录不存在')
  }
  
  console.log('构建后处理完成！')
}

// 如果直接运行此脚本
if (require.main === module) {
  postBuild()
}

module.exports = postBuild