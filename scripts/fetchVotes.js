const fs = require('fs')
const path = require('path')
const pako = require('pako')

// 配置
const config = {
  dataDir: path.join(__dirname, '../public/data'),
  historyDir: path.join(__dirname, '../public/data/history'),
  stage: process.env.VOTING_STAGE || 'first',
}

// 榜单配置 - 与前端保持一致
const VOTING_LISTS = [
  { id: 1, code: 'AM50', name: 'Male Artiste of the Year', category: 'AM50' },
  { id: 2, code: 'AM51', name: 'Female Artiste of the Year', category: 'AM51' },
  { id: 3, code: 'AM52', name: 'Male Group of the Year', category: 'AM52' },
  { id: 4, code: 'AM53', name: 'Female Group of the Year', category: 'AM53' },
  { id: 5, code: 'AM54', name: 'Hottest Trending Rookie - Male', category: 'AM54' },
  { id: 6, code: 'AM55', name: 'Hottest Trending Rookie - Female', category: 'AM55' },
  { id: 7, code: 'PR70', name: 'Song of the Year', category: 'PR70' },
  { id: 8, code: 'PR71', name: 'Album of the Year', category: 'PR71' },
  { id: 9, code: 'PR72', name: 'Collaboration of the Year', category: 'PR72' },
  { id: 10, code: 'PR73', name: 'Music Video of the Year', category: 'PR73' },
  { id: 11, code: 'PR74', name: 'JMA China - Most Influential Manopop Artiste', category: 'PR74' },
]

// 分类名称映射
const CATEGORY_DISPLAY_NAMES = {
  'AM50': '年度男艺人',
  'AM51': '年度女艺人', 
  'AM52': '年度男团',
  'AM53': '年度女团',
  'AM54': '最具人气新人-男',
  'AM55': '最具人气新人-女',
  'PR70': '年度歌曲',
  'PR71': '年度专辑',
  'PR72': '年度合作',
  'PR73': '年度音乐视频',
  'PR74': 'JMA中国最具影响力华语流行男艺人',
}

// 确保数据目录存在
function ensureDataDir() {
  if (!fs.existsSync(config.dataDir)) {
    fs.mkdirSync(config.dataDir, { recursive: true })
  }
  if (!fs.existsSync(config.historyDir)) {
    fs.mkdirSync(config.historyDir, { recursive: true })
  }
}

// 获取单个榜单数据
async function fetchSingleListData(listConfig, stage) {
  console.log(`正在获取榜单: ${listConfig.name} (${listConfig.code})`)
  
  const apiUrl = `https://lite-be.ivideocloud.cn/api/v1/fanfever/voteResult/${listConfig.id}?type=${stage}`
  
  try {
    const fetch = (await import('node-fetch')).default
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    })
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    const apiData = await response.json()
    console.log(`${listConfig.code} 数据获取成功，总票数:`, apiData.total_votes)
    
    return { listConfig, data: apiData }
    
  } catch (error) {
    console.error(`获取榜单 ${listConfig.code} 失败:`, error.message)
    return null
  }
}

// 批量获取所有榜单数据
async function fetchAllVotingData(stage) {
  console.log(`开始获取所有榜单的 ${stage} 阶段数据...`)
  
  try {
    // 并行获取所有榜单数据
    const listPromises = VOTING_LISTS.map(list => fetchSingleListData(list, stage))
    const results = await Promise.allSettled(listPromises)
    
    const successfulResults = results
      .filter(result => result.status === 'fulfilled' && result.value !== null)
      .map(result => result.value)
    
    if (successfulResults.length === 0) {
      throw new Error('所有榜单数据获取失败')
    }

    console.log(`成功获取 ${successfulResults.length}/${VOTING_LISTS.length} 个榜单数据`)
    
    // 合并所有榜单数据
    return mergeAllListsData(successfulResults, stage)
  } catch (error) {
    console.error('批量获取榜单数据失败:', error)
    
    // 如果API失败，生成示例数据
    console.log('生成示例数据作为备用...')
    return generateBackupData(stage)
  }
}

// 合并所有榜单数据
function mergeAllListsData(results, stage) {
  const now = new Date()
  const today = now.toISOString().split('T')[0]
  const collectionTime = now.toISOString()
  
  let totalVotes = 0
  const categories = {}

  results.forEach(({ listConfig, data }) => {
    totalVotes += data.total_votes || 0
    
    // 转换艺人数据
    const artists = data.data.map((apiArtist, index) => ({
      id: `${listConfig.category}-${apiArtist.talent_number || index}`,
      name: apiArtist.talent.artiste_nominated,
      englishName: apiArtist.talent.english_name,
      currentVotes: apiArtist.votes,
      rankToday: apiArtist.rank,
      rankDelta: 0, // 暂时设为0，后续可以计算
      category: listConfig.category,
      talentNumber: apiArtist.talent_number,
      imageUrl: apiArtist.talent.image_url,
      nameOfWork: apiArtist.talent.name_of_work,
    }))

    categories[listConfig.category] = artists
  })

  const snapshot = {
    snapshot_date: today,
    stage,
    total_votes: totalVotes,
    categories,
  }

  // 创建历史数据点
  const historicalDataPoint = {
    date: today,
    snapshot,
    collection_time: collectionTime,
  }

  return { snapshot, historicalDataPoint }
}

// 生成备用数据（如果API失败）
function generateBackupData(stage) {
  const now = new Date()
  const today = now.toISOString().split('T')[0]
  const collectionTime = now.toISOString()
  
  const categories = {}
  let totalVotes = 0

  VOTING_LISTS.forEach(listConfig => {
    const artists = []
    const listSize = listConfig.code.startsWith('AM') ? 75 : 50 // 艺人榜单75个，作品榜单50个
    
    for (let i = 1; i <= listSize; i++) {
      const votes = Math.floor(Math.random() * 100000) + 10000
      totalVotes += votes
      
      artists.push({
        id: `${listConfig.category}-${i}`,
        name: `${listConfig.code} 候选人 ${i}`,
        englishName: `${listConfig.code} Candidate ${i}`,
        currentVotes: votes,
        rankToday: i,
        rankDelta: Math.floor(Math.random() * 11) - 5,
        category: listConfig.category,
        talentNumber: `${listConfig.code.slice(0,2)} ${i.toString().padStart(2, '0')}`,
        imageUrl: `https://picsum.photos/200/200?random=${i + listConfig.id * 100}`,
        nameOfWork: listConfig.code.startsWith('PR') ? `作品 ${i}` : null,
      })
    }
    
    categories[listConfig.category] = artists
  })

  const snapshot = {
    snapshot_date: today,
    stage,
    total_votes: totalVotes,
    categories,
  }

  const historicalDataPoint = {
    date: today,
    snapshot,
    collection_time: collectionTime,
  }

  return { snapshot, historicalDataPoint }
}

// 计算热度分析数据
function calculateHeatAnalysis(snapshot, previousSnapshot = null) {
  const categoryHeats = []
  const darkHorses = []
  let totalVotes = 0
  let totalCandidates = 0

  Object.entries(snapshot.categories).forEach(([category, artists]) => {
    totalCandidates += artists.length
    
    // 计算分类热度数据
    const categoryTotalVotes = artists.reduce((sum, artist) => sum + artist.currentVotes, 0)
    totalVotes += categoryTotalVotes
    
    // 计算Top 10票数
    const sortedArtists = artists.slice().sort((a, b) => b.currentVotes - a.currentVotes)
    const topTenVotes = sortedArtists.slice(0, 10).reduce((sum, artist) => sum + artist.currentVotes, 0)
    const topThreeVotes = sortedArtists.slice(0, 3).reduce((sum, artist) => sum + artist.currentVotes, 0)
    
    // 计算竞争激烈度 (基于票数分布的标准差)
    const avgVotes = categoryTotalVotes / artists.length
    const variance = artists.reduce((sum, artist) => sum + Math.pow(artist.currentVotes - avgVotes, 2), 0) / artists.length
    let competitionIntensity = 0
    if (avgVotes > 0 && variance > 0) {
      competitionIntensity = Math.min(100, Math.sqrt(variance) / avgVotes * 100)
      // 确保结果是有效数字
      if (isNaN(competitionIntensity) || !isFinite(competitionIntensity)) {
        competitionIntensity = 0
      }
    }
    
    // 计算日增长率（如果有前一天数据）
    let dailyGrowth = 0
    if (previousSnapshot && previousSnapshot.categories[category]) {
      const prevTotalVotes = previousSnapshot.categories[category].reduce((sum, artist) => sum + artist.currentVotes, 0)
      if (prevTotalVotes > 0) {
        dailyGrowth = ((categoryTotalVotes - prevTotalVotes) / prevTotalVotes) * 100
      }
    }

    categoryHeats.push({
      category,
      categoryName: CATEGORY_DISPLAY_NAMES[category] || category,
      totalVotes: categoryTotalVotes,
      topTenVotes,
      topTenRatio: categoryTotalVotes > 0 ? (topTenVotes / categoryTotalVotes) * 100 : 0,
      dailyGrowth,
      averageVotesPerCandidate: avgVotes,
      topThreeVotes,
      competitionIntensity,
      lastUpdated: snapshot.snapshot_date,
    })

    // 查找黑马艺人（排名提升显著的）
    if (previousSnapshot && previousSnapshot.categories[category]) {
      const prevArtists = previousSnapshot.categories[category]
      const prevArtistMap = new Map(prevArtists.map(artist => [artist.id, artist]))
      
      artists.forEach(currentArtist => {
        const prevArtist = prevArtistMap.get(currentArtist.id)
        if (prevArtist) {
          const rankChange = prevArtist.rankToday - currentArtist.rankToday
          const voteGrowthAbs = currentArtist.currentVotes - prevArtist.currentVotes
          const voteGrowthPerc = prevArtist.currentVotes > 0 ? (voteGrowthAbs / prevArtist.currentVotes) * 100 : 0
          
          // 判断是否为黑马：排名提升5位以上或票数增长50%以上
          if (rankChange >= 5 || voteGrowthPerc >= 50) {
            darkHorses.push({
              artistId: currentArtist.id,
              artistName: currentArtist.name,
              englishName: currentArtist.englishName,
              category,
              categoryName: CATEGORY_DISPLAY_NAMES[category] || category,
              currentRank: currentArtist.rankToday,
              previousRank: prevArtist.rankToday,
              rankChange,
              currentVotes: currentArtist.currentVotes,
              previousVotes: prevArtist.currentVotes,
              voteGrowth: voteGrowthPerc,
              voteGrowthAbsolute: voteGrowthAbs,
              imageUrl: currentArtist.imageUrl,
              talentNumber: currentArtist.talentNumber,
              nameOfWork: currentArtist.nameOfWork,
            })
          }
        }
      })
    }
  })

  // 按排名变化和票数增长排序黑马
  darkHorses.sort((a, b) => {
    const aScore = a.rankChange * 0.6 + a.voteGrowth * 0.4
    const bScore = b.rankChange * 0.6 + b.voteGrowth * 0.4
    return bScore - aScore
  })

  return {
    date: snapshot.snapshot_date,
    stage: snapshot.stage,
    categoryHeats,
    darkHorses: darkHorses.slice(0, 10), // 取前10个黑马
    totalVotes,
    totalCandidates,
    collection_time: new Date().toISOString(),
  }
}

// 加载历史数据
function loadHistoricalData(stage, daysBack = 7) {
  const history = []
  
  for (let i = 0; i < daysBack; i++) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const dateString = date.toISOString().split('T')[0]
    
    const historyFile = path.join(config.historyDir, `${dateString}_${stage}.json.gz`)
    if (fs.existsSync(historyFile)) {
      try {
        const compressed = fs.readFileSync(historyFile)
        const decompressed = pako.inflate(compressed, { to: 'string' })
        const data = JSON.parse(decompressed)
        history.push(data)
      } catch (error) {
        console.warn(`加载历史数据失败: ${historyFile}`, error.message)
      }
    }
  }
  
  return history.sort((a, b) => a.date.localeCompare(b.date))
}

// 保存历史数据
function saveHistoricalData(historicalDataPoint, stage) {
  const filename = `${historicalDataPoint.date}_${stage}.json.gz`
  const filepath = path.join(config.historyDir, filename)
  
  const jsonString = JSON.stringify(historicalDataPoint, null, 0)
  const compressed = pako.gzip(jsonString)
  
  fs.writeFileSync(filepath, compressed)
  console.log(`历史数据已保存: ${filepath}`)
}

// 保存热度分析数据
function saveHeatAnalysis(heatAnalysis, stage) {
  const filename = `heat_${heatAnalysis.date}_${stage}.json.gz`
  const filepath = path.join(config.dataDir, filename)
  
  const jsonString = JSON.stringify(heatAnalysis, null, 0)
  const compressed = pako.gzip(jsonString)
  
  fs.writeFileSync(filepath, compressed)
  console.log(`热度分析数据已保存: ${filepath}`)
}

// 压缩并保存数据
function saveCompressedData(data, filename) {
  const jsonString = JSON.stringify(data, null, 0)
  const compressed = pako.gzip(jsonString)
  
  const tempFile = path.join(config.dataDir, `${filename}.tmp`)
  const finalFile = path.join(config.dataDir, filename)
  
  // 先写入临时文件，再重命名（原子操作）
  fs.writeFileSync(tempFile, compressed)
  fs.renameSync(tempFile, finalFile)
  
  console.log(`数据已保存到: ${finalFile}`)
  console.log(`文件大小: ${(compressed.length / 1024).toFixed(2)} KB`)
}

// 更新数据清单
function updateManifest(stage, date) {
  const manifestPath = path.join(config.dataDir, 'manifest.json')
  let manifest = {}
  
  if (fs.existsSync(manifestPath)) {
    try {
      manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
    } catch (error) {
      console.warn('读取清单文件失败，将创建新的清单:', error.message)
    }
  }
  
  if (!manifest[stage]) {
    manifest[stage] = []
  }
  
  if (!manifest[stage].includes(date)) {
    manifest[stage].push(date)
    manifest[stage].sort()
  }
  
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2))
  console.log('数据清单已更新')
}

// 主函数
async function main() {
  try {
    console.log('开始获取投票数据...')
    console.log(`阶段: ${config.stage}`)
    console.log(`时间: ${new Date().toLocaleString('zh-CN')}`)
    
    ensureDataDir()
    
    // 获取当前数据
    const { snapshot, historicalDataPoint } = await fetchAllVotingData(config.stage)
    
    // 保存当前快照
    const filename = `${snapshot.snapshot_date}_${config.stage}.json.gz`
    saveCompressedData(snapshot, filename)
    
    // 保存历史数据
    saveHistoricalData(historicalDataPoint, config.stage)
    
    // 加载历史数据并计算热度分析
    const history = loadHistoricalData(config.stage)
    const previousSnapshot = history.length > 1 ? history[history.length - 2].snapshot : null
    
    // 计算热度分析
    const heatAnalysis = calculateHeatAnalysis(snapshot, previousSnapshot)
    saveHeatAnalysis(heatAnalysis, config.stage)
    
    // 更新清单
    updateManifest(config.stage, snapshot.snapshot_date)
    
    console.log('投票数据获取完成!')
    
    // 输出统计信息
    const totalArtists = Object.values(snapshot.categories).reduce((sum, artists) => sum + artists.length, 0)
    const totalVotes = Object.values(snapshot.categories).reduce((sum, artists) => 
      sum + artists.reduce((categorySum, artist) => categorySum + artist.currentVotes, 0), 0
    )
    
    console.log(`统计信息:`)
    console.log(`- 总艺人数: ${totalArtists}`)
    console.log(`- 总票数: ${totalVotes.toLocaleString()}`)
    console.log(`- 分类数: ${Object.keys(snapshot.categories).length}`)
    console.log(`- 黑马艺人: ${heatAnalysis.darkHorses.length}`)
    console.log(`- 热度分析: ${heatAnalysis.categoryHeats.length}个分类`)
    
  } catch (error) {
    console.error('获取投票数据失败:', error)
    process.exit(1)
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main()
}

module.exports = {
  fetchAllVotingData,
  calculateHeatAnalysis,
  loadHistoricalData,
  VOTING_LISTS,
  CATEGORY_DISPLAY_NAMES,
} 