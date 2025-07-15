const cron = require('node-cron')
const { spawn } = require('child_process')
const path = require('path')

// 定时任务配置
const SCHEDULE_CONFIG = {
  // 每天中午12:05分执行 (确保在12点后)
  dailyDataCollection: '5 12 * * *',
  // 周日凌晨1点执行清理任务
  weeklyCleanup: '0 1 * * 0'
}

// 日志功能
function log(message, type = 'INFO') {
  const timestamp = new Date().toISOString()
  console.log(`[${timestamp}] [${type}] ${message}`)
}

// 执行数据获取脚本
function executeDataCollection(stage = 'first') {
  return new Promise((resolve, reject) => {
    log(`开始执行数据获取任务 - 阶段: ${stage}`)
    
    const scriptPath = path.join(__dirname, 'fetchVotes.js')
    const child = spawn('node', [scriptPath], {
      env: { ...process.env, VOTING_STAGE: stage },
      stdio: 'inherit'
    })
    
    child.on('close', (code) => {
      if (code === 0) {
        log(`数据获取任务完成 - 阶段: ${stage}`)
        resolve()
      } else {
        log(`数据获取任务失败 - 阶段: ${stage}, 退出码: ${code}`, 'ERROR')
        reject(new Error(`数据获取失败，退出码: ${code}`))
      }
    })
    
    child.on('error', (error) => {
      log(`数据获取任务出错 - 阶段: ${stage}: ${error.message}`, 'ERROR')
      reject(error)
    })
  })
}

// 清理过期数据
function cleanupOldData() {
  log('执行数据清理任务...')
  
  const fs = require('fs')
  const dataDir = path.join(__dirname, '../public/data')
  const historyDir = path.join(dataDir, 'history')
  
  // 清理30天前的历史数据
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - 30)
  
  try {
    // 清理历史数据
    if (fs.existsSync(historyDir)) {
      const files = fs.readdirSync(historyDir)
      files.forEach(file => {
        const filePath = path.join(historyDir, file)
        const stats = fs.statSync(filePath)
        
        if (stats.mtime < cutoffDate) {
          fs.unlinkSync(filePath)
          log(`删除过期文件: ${file}`)
        }
      })
    }
    
    // 清理过期的热度分析数据
    const heatFiles = fs.readdirSync(dataDir).filter(file => file.startsWith('heat_'))
    heatFiles.forEach(file => {
      const filePath = path.join(dataDir, file)
      const stats = fs.statSync(filePath)
      
      if (stats.mtime < cutoffDate) {
        fs.unlinkSync(filePath)
        log(`删除过期热度分析文件: ${file}`)
      }
    })
    
    log('数据清理任务完成')
  } catch (error) {
    log(`数据清理任务失败: ${error.message}`, 'ERROR')
  }
}

// 检查当前时间是否在12点后
function isAfterNoon() {
  const now = new Date()
  const hour = now.getHours()
  return hour >= 12
}

// 主要的数据收集任务
async function mainDataCollectionTask() {
  if (!isAfterNoon()) {
    log('当前时间未到中午12点，跳过数据收集任务')
    return
  }
  
  try {
    log('开始执行每日数据收集任务')
    
    // 获取第一阶段数据
    await executeDataCollection('first')
    
    // 等待5秒，避免API请求过于频繁
    await new Promise(resolve => setTimeout(resolve, 5000))
    
    // 获取第二阶段数据
    await executeDataCollection('second')
    
    log('每日数据收集任务完成')
  } catch (error) {
    log(`每日数据收集任务失败: ${error.message}`, 'ERROR')
  }
}



// 启动定时任务
function startScheduler() {
  log('启动定时任务调度器...')
  
  // 每日数据收集任务 - 中午12:05
  cron.schedule(SCHEDULE_CONFIG.dailyDataCollection, () => {
    log('触发每日数据收集任务')
    mainDataCollectionTask()
  }, {
    scheduled: true,
    timezone: 'Asia/Shanghai'
  })
  

  
  // 周清理任务 - 每周日凌晨1点
  cron.schedule(SCHEDULE_CONFIG.weeklyCleanup, () => {
    log('触发周清理任务')
    cleanupOldData()
  }, {
    scheduled: true,
    timezone: 'Asia/Shanghai'
  })
  
  log('定时任务调度器启动成功')
  log(`每日数据收集: ${SCHEDULE_CONFIG.dailyDataCollection}`)
  log(`周清理: ${SCHEDULE_CONFIG.weeklyCleanup}`)
  
  // 启动时立即执行一次数据收集（如果时间合适）
  if (isAfterNoon()) {
    log('启动时执行初始数据收集')
    mainDataCollectionTask()
  }
}

// 优雅关闭
function shutdown() {
  log('正在关闭定时任务调度器...')
  process.exit(0)
}

// 监听关闭信号
process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)

// 未捕获的异常处理
process.on('uncaughtException', (error) => {
  log(`未捕获的异常: ${error.message}`, 'ERROR')
  console.error(error.stack)
})

process.on('unhandledRejection', (reason, promise) => {
  log(`未处理的Promise拒绝: ${reason}`, 'ERROR')
  console.error(reason)
})

// 如果直接运行此脚本，启动调度器
if (require.main === module) {
  startScheduler()
  
  // 保持进程运行
  process.stdin.resume()
}

module.exports = {
  startScheduler,
  executeDataCollection,
  cleanupOldData,
  SCHEDULE_CONFIG
} 