const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

// 测试构建脚本
function testBuild() {
  console.log('🚀 开始测试构建...')
  
  try {
    // 1. 清理之前的构建
    const outDir = path.join(__dirname, '../out')
    if (fs.existsSync(outDir)) {
      console.log('🧹 清理之前的构建文件...')
      fs.rmSync(outDir, { recursive: true, force: true })
    }
    
    // 2. 运行构建
    console.log('🔨 运行 npm run build...')
    execSync('npm run build', { stdio: 'inherit', cwd: path.join(__dirname, '..') })
    
    // 3. 检查构建结果
    console.log('🔍 检查构建结果...')
    
    const requiredFiles = [
      'index.html',
      '404.html',
      '.nojekyll',
      'dashboard/index.html',
      'trend/index.html',
      'heat/index.html',
      '_next'
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
    
    // 4. 检查数据文件
    const dataDir = path.join(outDir, 'data')
    if (fs.existsSync(dataDir)) {
      const dataFiles = fs.readdirSync(dataDir)
      console.log(`✅ data/ 目录存在，包含 ${dataFiles.length} 个文件`)
      
      // 列出前几个数据文件
      dataFiles.slice(0, 5).forEach(file => {
        console.log(`   - ${file}`)
      })
      if (dataFiles.length > 5) {
        console.log(`   ... 还有 ${dataFiles.length - 5} 个文件`)
      }
    } else {
      console.log(`⚠️  data/ 目录不存在`)
    }
    
    // 5. 检查 HTML 文件内容
    console.log('🔍 检查 HTML 文件内容...')
    const indexPath = path.join(outDir, 'index.html')
    if (fs.existsSync(indexPath)) {
      const indexContent = fs.readFileSync(indexPath, 'utf8')
      if (indexContent.includes('JMA-Voting')) {
        console.log('✅ index.html 包含正确的 basePath')
      } else {
        console.log('⚠️  index.html 可能缺少 basePath 配置')
      }
    }
    
    // 6. 总结
    console.log('\n📊 构建测试总结:')
    if (allFilesExist) {
      console.log('✅ 所有必需文件都存在')
      console.log('🎉 构建测试通过！')
      
      console.log('\n📝 部署建议:')
      console.log('1. 提交所有更改到 GitHub')
      console.log('2. 手动触发 GitHub Actions 工作流')
      console.log('3. 或者等待定时任务自动运行')
      console.log('4. 检查 GitHub Pages 设置是否正确')
      
    } else {
      console.log('❌ 部分文件缺失，需要检查构建配置')
      process.exit(1)
    }
    
  } catch (error) {
    console.error('❌ 构建测试失败:', error.message)
    process.exit(1)
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  testBuild()
}

module.exports = testBuild