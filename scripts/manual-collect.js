#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const pako = require('pako')

// 使用内置的fetch（Node.js 18+）
const fetch = globalThis.fetch

// 支持环境变量配置API地址
const API_BASE_URL = process.env.FANFEVER_API_URL || 'https://lite-be.cfanfever.com/api/v1/fanfever'

// 榜单配置
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

async function fetchSingleListData(listId, stage) {
  try {
    const listConfig = VOTING_LISTS.find(list => list.id === listId)
    if (!listConfig) {
      console.warn(`未找到榜单配置，ID: ${listId}`)
      return null
    }

    console.log(`获取榜单: ${listConfig.name} (${listConfig.code})`)
    
    const response = await fetch(`${API_BASE_URL}/voteResult/${listId}?type=${stage}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      cache: 'no-cache',
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const apiData = await response.json()
    console.log(`${listConfig.code} 数据获取成功，总票数:`, apiData.total_votes)

    return { listConfig, data: apiData }
  } catch (error) {
    console.error(`获取榜单 ${listId} 数据失败:`, error)
    return null
  }
}

async function collectVotingData(stage = 'first') {
  console.log(`开始收集 ${stage} 阶段投票数据...`)
  console.log(`API地址: ${API_BASE_URL}`)
  
  const now = new Date()
  const today = now.toISOString().split('T')[0]
  const timestamp = now.getTime()
  
  // 确保数据目录存在
  const dataDir = path.join(__dirname, '../public/data')
  const historyDir = path.join(dataDir, 'history')
  
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }
  if (!fs.existsSync(historyDir)) {
    fs.mkdirSync(historyDir, { recursive: true })
  }
  
  try {
    // 并行获取所有榜单数据
    const listPromises = VOTING_LISTS.map(list => fetchSingleListData(list.id, stage))
    const results = await Promise.allSettled(listPromises)
    
    const successfulResults = results
      .filter(result => result.status === 'fulfilled' && result.value !== null)
      .map(result => result.value)
    
    if (successfulResults.length === 0) {
      throw new Error('所有榜单数据获取失败')
    }
    
    console.log(`成功获取 ${successfulResults.length}/${VOTING_LISTS.length} 个榜单数据`)
    
    // 合并数据
    let totalVotes = 0
    const categories = {}
    
    successfulResults.forEach(({ listConfig, data }) => {
      totalVotes += data.total_votes || 0
      
      // 转换艺人数据
      const artists = data.data.map((apiArtist, index) => ({
        id: `${listConfig.category}-${apiArtist.talent_number || index}`,
        name: apiArtist.talent.artiste_nominated,
        englishName: apiArtist.talent.english_name,
        currentVotes: apiArtist.votes,
        rankToday: apiArtist.rank,
        rankDelta: 0,
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
      collection_time: now.toISOString(),
    }
    
    // 压缩并保存数据
    const compressed = pako.gzip(JSON.stringify(snapshot, null, 2))
    const filename = `${today}_${stage}.json.gz`
    const filepath = path.join(dataDir, filename)
    
    fs.writeFileSync(filepath, compressed)
    console.log(`✅ 数据已保存到: ${filename}`)
    
    // 保存到历史目录
    const historyFilepath = path.join(historyDir, filename)
    fs.writeFileSync(historyFilepath, compressed)
    console.log(`✅ 历史数据已保存到: history/${filename}`)
    
    // 更新manifest文件
    const manifestPath = path.join(dataDir, 'manifest.json')
    let manifest = {}
    
    if (fs.existsSync(manifestPath)) {
      manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
    }
    
    if (!manifest[stage]) {
      manifest[stage] = []
    }
    
    if (!manifest[stage].includes(today)) {
      manifest[stage].push(today)
    }
    
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2))
    console.log(`✅ Manifest已更新`)
    
    // 生成热度分析数据
    const heatAnalysis = generateHeatAnalysis(snapshot, stage)
    const heatFilename = `heat_${today}_${stage}.json.gz`
    const heatFilepath = path.join(dataDir, heatFilename)
    const heatCompressed = pako.gzip(JSON.stringify(heatAnalysis, null, 2))
    
    fs.writeFileSync(heatFilepath, heatCompressed)
    console.log(`✅ 热度分析数据已保存到: ${heatFilename}`)
    
    // 更新运行记录
    updateRunRecords(stage, true)
    
    console.log(`🎉 ${stage} 阶段数据收集完成！`)
    console.log(`📊 总票数: ${totalVotes.toLocaleString()}`)
    console.log(`📋 分类数: ${Object.keys(categories).length}`)
    
    return snapshot
    
  } catch (error) {
    console.error(`❌ 数据收集失败:`, error)
    updateRunRecords(stage, false, error.message)
    throw error
  }
}

function generateHeatAnalysis(snapshot, stage) {
  const categoryHeats = []
  const darkHorses = []
  
  Object.entries(snapshot.categories).forEach(([category, artists]) => {
    const categoryTotalVotes = artists.reduce((sum, artist) => sum + artist.currentVotes, 0)
    const sortedArtists = artists.slice().sort((a, b) => b.currentVotes - a.currentVotes)
    
    const topTenVotes = sortedArtists.slice(0, 10).reduce((sum, artist) => sum + artist.currentVotes, 0)
    const topThreeVotes = sortedArtists.slice(0, 3).reduce((sum, artist) => sum + artist.currentVotes, 0)
    
    const avgVotes = categoryTotalVotes / artists.length
    const variance = artists.reduce((sum, artist) => sum + Math.pow(artist.currentVotes - avgVotes, 2), 0) / artists.length
    let competitionIntensity = 0
    
    if (avgVotes > 0 && variance > 0) {
      competitionIntensity = Math.min(100, Math.sqrt(variance) / avgVotes * 100)
      if (isNaN(competitionIntensity) || !isFinite(competitionIntensity)) {
        competitionIntensity = 0
      }
    }
    
    const listConfig = VOTING_LISTS.find(list => list.category === category)
    
    categoryHeats.push({
      category,
      categoryName: listConfig?.name || category,
      totalVotes: categoryTotalVotes,
      topTenVotes,
      topTenRatio: categoryTotalVotes > 0 ? (topTenVotes / categoryTotalVotes) * 100 : 0,
      dailyGrowth: 0,
      averageVotesPerCandidate: avgVotes,
      topThreeVotes,
      competitionIntensity,
      lastUpdated: snapshot.snapshot_date,
    })
  })
  
  return {
    date: snapshot.snapshot_date,
    stage,
    categoryHeats,
    darkHorses: darkHorses.slice(0, 10),
    totalVotes: snapshot.total_votes || 0,
    totalCandidates: Object.values(snapshot.categories).reduce((sum, artists) => sum + artists.length, 0),
    collection_time: new Date().toISOString(),
  }
}

function updateRunRecords(stage, success, error = null) {
  const recordsPath = path.join(__dirname, '../public/data/run-records.json')
  let records = {}
  
  if (fs.existsSync(recordsPath)) {
    records = JSON.parse(fs.readFileSync(recordsPath, 'utf8'))
  }
  
  if (!records[stage]) {
    records[stage] = []
  }
  
  const now = new Date()
  const record = {
    date: now.toISOString().split('T')[0],
    time: now.toISOString(),
    timestamp: now.getTime(),
    success,
    error: error || null
  }
  
  records[stage].push(record)
  
  // 只保留最近10条记录
  if (records[stage].length > 10) {
    records[stage] = records[stage].slice(-10)
  }
  
  fs.writeFileSync(recordsPath, JSON.stringify(records, null, 2))
  console.log(`📝 运行记录已更新`)
}

// 主函数
async function main() {
  const stage = process.argv[2] || 'first'
  
  if (!['first', 'second'].includes(stage)) {
    console.error('❌ 无效的阶段参数，请使用 "first" 或 "second"')
    process.exit(1)
  }
  
  try {
    await collectVotingData(stage)
    console.log('✅ 手动数据收集完成！')
  } catch (error) {
    console.error('❌ 手动数据收集失败:', error)
    process.exit(1)
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main()
}

module.exports = { collectVotingData } 