import { DailySnapshot, VotingStage, HeatAnalysisHistory } from '@/types'
import pako from 'pako'

// 支持环境变量配置API地址，默认使用正式接口
const API_BASE_URL = process.env.API_BASE_URL || 'https://lite-be.cfanfever.com/api/v1/fanfever'

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

// API响应类型
interface ApiResponse {
  code: string
  message: string
  total_votes: number
  data: ApiArtist[]
}

interface ApiArtist {
  rank: number
  votes: number
  talent_number: string
  talent: {
    artiste_nominated: string
    english_name: string
    name_of_work: string | null
    image_url: string
  }
  data_source?: Array<{
    platform: string
    votes: number
  }>
}

// 主要的API调用函数 - 优先使用本地数据，失败时使用备用数据
export async function fetchVotingDataFromApi(stage: VotingStage): Promise<DailySnapshot | null> {
  console.log(`开始获取 ${stage} 阶段数据...`)
  
  // 首先尝试加载本地数据
  try {
    console.log('尝试加载本地数据...')
    const localData = await fetchLocalData(stage)
    if (localData) {
      console.log('✅ 使用本地数据成功')
      return localData
    }
  } catch (error) {
    console.log('❌ 本地数据加载失败:', error)
  }

  // 如果本地数据不可用，使用备用数据
  console.log('📝 本地数据不可用，使用备用数据')
  console.log('💡 提示: 请运行 npm run collect:first 收集最新数据')
  return generateFallbackData(stage)
}

// 获取热度分析数据
export async function fetchHeatAnalysisData(stage: VotingStage): Promise<HeatAnalysisHistory | null> {
  try {
    console.log('获取热度分析数据...')
    
    // 优先尝试从实时API获取最新数据并生成热度分析
    try {
      console.log('尝试从API获取实时数据...')
      const apiData = await fetchVotingDataFromApi(stage)
      if (apiData) {
        console.log('使用API数据生成热度分析')
        return generateHeatAnalysisFromSnapshot(apiData, stage)
      }
    } catch (apiError) {
      console.log('API数据获取失败，尝试本地文件:', apiError)
    }
    
    // 尝试获取今天的热度分析数据文件
    const today = new Date().toISOString().split('T')[0]
    const filename = `heat_${today}_${stage}.json.gz`
    
    const response = await fetch(`/data/${filename}`)
    if (!response.ok) {
      throw new Error(`热度分析文件不存在: ${filename}`)
    }

    // 解压数据
    const arrayBuffer = await response.arrayBuffer()
    const compressed = new Uint8Array(arrayBuffer)
    
    // 使用静态导入的pako
    const decompressed = pako.inflate(compressed, { to: 'string' })
    const data = JSON.parse(decompressed)
    
    console.log('使用本地热度分析文件')
    return data
  } catch (error) {
    console.warn('所有数据源失败:', error)
    
    // 如果没有热度分析数据，返回null，让前端处理
    return null
  }
}

// 从快照数据生成热度分析
function generateHeatAnalysisFromSnapshot(snapshot: DailySnapshot, stage: VotingStage): HeatAnalysisHistory {
  const categoryHeats: any[] = []
  const darkHorses: any[] = []
  
  // 生成分类热度数据
  Object.entries(snapshot.categories).forEach(([category, artists]) => {
    const categoryTotalVotes = artists.reduce((sum, artist) => sum + artist.currentVotes, 0)
    
    // 计算Top 10票数
    const sortedArtists = artists.slice().sort((a, b) => b.currentVotes - a.currentVotes)
    const topTenVotes = sortedArtists.slice(0, 10).reduce((sum, artist) => sum + artist.currentVotes, 0)
    const topThreeVotes = sortedArtists.slice(0, 3).reduce((sum, artist) => sum + artist.currentVotes, 0)
    
    // 计算竞争激烈度
    const avgVotes = categoryTotalVotes / artists.length
    const variance = artists.reduce((sum, artist) => sum + Math.pow(artist.currentVotes - avgVotes, 2), 0) / artists.length
    let competitionIntensity = 0
    if (avgVotes > 0 && variance > 0) {
      competitionIntensity = Math.min(100, Math.sqrt(variance) / avgVotes * 100)
      if (isNaN(competitionIntensity) || !isFinite(competitionIntensity)) {
        competitionIntensity = 0
      }
    }

    // 找到榜单配置
    const listConfig = VOTING_LISTS.find(list => list.category === category)
    
    categoryHeats.push({
      category,
      categoryName: listConfig?.name || category,
      totalVotes: categoryTotalVotes,
      topTenVotes,
      topTenRatio: categoryTotalVotes > 0 ? (topTenVotes / categoryTotalVotes) * 100 : 0,
      dailyGrowth: 0, // 无历史数据时设为0
      averageVotesPerCandidate: avgVotes,
      topThreeVotes,
      competitionIntensity,
      lastUpdated: snapshot.snapshot_date,
    })

    // 查找潜在黑马（排名较低但票数相对较高的）
    const potentialDarkHorses = sortedArtists.slice(15, 50) // 排名15-50的候选人
      .filter(artist => artist.currentVotes > avgVotes * 1.2) // 票数超过平均值20%
      .slice(0, 3) // 最多取3个

         potentialDarkHorses.forEach(artist => {
       const currentRank = artist.rankToday || sortedArtists.findIndex(a => a.id === artist.id) + 1
       const currentVotes = artist.currentVotes || 0
       
       darkHorses.push({
         artistId: artist.id,
         artistName: artist.name,
         englishName: artist.englishName || '',
         category,
         categoryName: listConfig?.name || category,
         currentRank,
         previousRank: currentRank, // 暂时使用当前排名，后续可通过历史数据计算
         rankChange: 0, // 暂时设为0，后续可通过历史数据计算
         currentVotes,
         previousVotes: currentVotes || 0, // 暂时使用当前票数，后续可通过历史数据计算
         voteGrowth: 0, // 暂时设为0，后续可通过历史数据计算
         voteGrowthAbsolute: 0, // 暂时设为0，后续可通过历史数据计算
         imageUrl: artist.imageUrl || '',
         talentNumber: artist.talentNumber || '',
         nameOfWork: artist.nameOfWork || null,
         platformVotes: artist.platformVotes || [], // 添加平台票数信息
       })
     })
  })

  return {
    date: snapshot.snapshot_date,
    stage,
    categoryHeats,
    darkHorses: darkHorses.slice(0, 10), // 最多10个黑马
    totalVotes: snapshot.total_votes || 0,
    totalCandidates: Object.values(snapshot.categories).reduce((sum, artists) => sum + artists.length, 0),
    collection_time: new Date().toISOString(),
  }
}

// 获取多日热度分析数据（用于趋势图）
export async function fetchMultiDayHeatAnalysis(stage: VotingStage, days: number = 7): Promise<HeatAnalysisHistory[]> {
  const results: HeatAnalysisHistory[] = []
  
  for (let i = 0; i < days; i++) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const dateString = date.toISOString().split('T')[0]
    
    try {
      const filename = `heat_${dateString}_${stage}.json.gz`
      const response = await fetch(`/data/${filename}`)
      
      if (response.ok) {
        const arrayBuffer = await response.arrayBuffer()
        const compressed = new Uint8Array(arrayBuffer)
        const decompressed = pako.inflate(compressed, { to: 'string' })
        const data = JSON.parse(decompressed)
        results.push(data)
      }
    } catch (error) {
      console.warn(`加载 ${dateString} 热度数据失败:`, error)
    }
  }
  
  return results.sort((a, b) => a.date.localeCompare(b.date))
}

// 获取艺人历史趋势数据
export async function fetchArtistTrendData(
  stage: VotingStage, 
  artistId: string, 
  days: number = 7
): Promise<{ date: string; rank: number; votes: number }[]> {
  const trendData: { date: string; rank: number; votes: number }[] = []
  
  for (let i = 0; i < days; i++) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const dateString = date.toISOString().split('T')[0]
    
    try {
      const filename = `${dateString}_${stage}.json.gz`
      const response = await fetch(`/data/${filename}`)
      
      if (response.ok) {
        const arrayBuffer = await response.arrayBuffer()
        const compressed = new Uint8Array(arrayBuffer)
        const decompressed = pako.inflate(compressed, { to: 'string' })
        const data = JSON.parse(decompressed)
        
        // 在所有分类中查找该艺人
        let foundArtist: any = null
        Object.values(data.categories).forEach((categoryArtists: any) => {
          if (Array.isArray(categoryArtists)) {
            const artist = categoryArtists.find((a: any) => a.id === artistId)
            if (artist) {
              foundArtist = artist
            }
          }
        })
        
        if (foundArtist) {
          trendData.push({
            date: dateString,
            rank: foundArtist.rankToday,
            votes: foundArtist.currentVotes
          })
        }
      }
    } catch (error) {
      console.warn(`加载 ${dateString} 数据失败:`, error)
    }
  }
  
  return trendData.sort((a, b) => a.date.localeCompare(b.date))
}

// 获取榜单趋势数据
export async function fetchCategoryTrendData(stage: VotingStage, days: number = 7): Promise<{
  dates: string[]
  categories: string[]
  trendsData: {
    [category: string]: {
      categoryName: string
      totalVotes: number[]
      dailyGrowth: number[]
      competitionIntensity: number[]
      averageVotes: number[]
      topTenRatio: number[]
    }
  }
}> {
  let multiDayData = await fetchMultiDayHeatAnalysis(stage, days)
  
    // 如果完全没有数据，返回空数据
  if (multiDayData.length < 1) {
    console.log('暂无任何历史数据')
    return {
      dates: [],
      categories: [],
      trendsData: {}
    }
  }

  const dates = multiDayData.map(data => data.date.slice(5)) // MM-DD格式
  const categories = multiDayData[0].categoryHeats.map(cat => cat.category)
  const trendsData: any = {}

  // 为每个分类准备趋势数据
  categories.forEach(category => {
    const categoryData = multiDayData[0].categoryHeats.find(cat => cat.category === category)
    if (categoryData) {
      trendsData[category] = {
        categoryName: categoryData.categoryName,
        totalVotes: [],
        dailyGrowth: [],
        competitionIntensity: [],
        averageVotes: [],
        topTenRatio: []
      }
    }
  })

  // 填充每一天的数据
  multiDayData.forEach(dayData => {
    dayData.categoryHeats.forEach(cat => {
      if (trendsData[cat.category]) {
        trendsData[cat.category].totalVotes.push(cat.totalVotes)
        trendsData[cat.category].dailyGrowth.push(cat.dailyGrowth)
        trendsData[cat.category].competitionIntensity.push(cat.competitionIntensity || 0)
        trendsData[cat.category].averageVotes.push(cat.averageVotesPerCandidate)
        trendsData[cat.category].topTenRatio.push(cat.topTenRatio)
      }
    })
  })

  return {
    dates,
    categories,
    trendsData
  }
}





// 从本地压缩文件加载数据
async function fetchLocalData(stage: VotingStage): Promise<DailySnapshot | null> {
  try {
    console.log('🔍 开始加载本地数据...')
    
    // 首先获取manifest文件，找到最新的可用数据
    const manifestResponse = await fetch('/data/manifest.json')
    if (!manifestResponse.ok) {
      throw new Error('无法加载manifest文件')
    }
    
    const manifest = await manifestResponse.json()
    console.log('📋 Manifest内容:', manifest)
    
    const availableDates = manifest[stage] || []
    console.log(`📅 ${stage} 阶段可用日期:`, availableDates)
    
    if (availableDates.length === 0) {
      throw new Error(`没有可用的 ${stage} 阶段数据`)
    }
    
    // 使用最新的可用数据
    const latestDate = availableDates[availableDates.length - 1]
    const filename = `${latestDate}_${stage}.json.gz`
    
    console.log(`📁 尝试加载数据文件: ${filename}`)
    
    const response = await fetch(`/data/${filename}`)
    if (!response.ok) {
      throw new Error(`本地文件不存在: ${filename}`)
    }

    console.log(`✅ 文件加载成功，大小: ${response.headers.get('content-length')} bytes`)

    // 解压数据
    const arrayBuffer = await response.arrayBuffer()
    const compressed = new Uint8Array(arrayBuffer)
    
    console.log(`📦 压缩数据大小: ${compressed.length} bytes`)
    
    // 使用静态导入的pako
    const decompressed = pako.inflate(compressed, { to: 'string' })
    
    console.log(`📄 解压后数据大小: ${decompressed.length} characters`)
    
    const data = JSON.parse(decompressed)
    
    console.log(`✅ 成功加载数据: ${filename}`)
    console.log(`📊 数据概览:`, {
      snapshot_date: data.snapshot_date,
      stage: data.stage,
      total_votes: data.total_votes,
      categories: Object.keys(data.categories || {}),
      categoryCount: Object.keys(data.categories || {}).length
    })
    
    return data
  } catch (error) {
    console.error('❌ 加载本地数据失败:', error)
    return null
  }
}

// 从API获取所有榜单数据（客户端环境下跳过，避免CORS问题）
async function fetchAllVotingDataFromAPI(stage: VotingStage): Promise<DailySnapshot | null> {
  console.log(`⚠️ 客户端环境下跳过API调用，避免CORS问题`)
  console.log(`📝 请使用手动数据收集命令: npm run collect:${stage}`)
  return null
}

// 获取单个榜单数据
async function fetchSingleListData(listId: number, stage: VotingStage): Promise<{ listConfig: any, data: ApiResponse } | null> {
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
      // 添加CORS配置
      mode: 'cors',
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const apiData: ApiResponse = await response.json()
    console.log(`${listConfig.code} 数据获取成功，总票数:`, apiData.total_votes)

    return { listConfig, data: apiData }
  } catch (error) {
    console.error(`获取榜单 ${listId} 数据失败:`, error)
    // 返回 null，避免抛出未捕获异常
    return null
  }
}

// 合并所有榜单数据为单一快照
function mergeAllListsData(results: any[], stage: VotingStage): DailySnapshot {
  const now = new Date().toISOString().split('T')[0]
  let totalVotes = 0
  const categories: { [category: string]: any[] } = {}

  results.forEach(({ listConfig, data }) => {
    totalVotes += data.total_votes || 0
    
    // 转换艺人数据
    const artists = data.data.map((apiArtist: ApiArtist, index: number) => ({
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
      platformVotes: apiArtist.data_source || [], // 添加平台票数数据
    }))

    categories[listConfig.category] = artists
  })

  return {
    snapshot_date: now,
    stage,
    total_votes: totalVotes,
    categories,
  }
}

// 不再生成假数据，返回null表示无数据
function generateFallbackData(stage: VotingStage): DailySnapshot | null {
  console.log(`❌ 没有可用的 ${stage} 阶段数据`)
  console.log(`📝 请运行 npm run collect:${stage} 收集最新数据`)
  return null
}

// 兼容的多阶段数据获取函数
export async function fetchMultiStageData(): Promise<{ [stage: string]: DailySnapshot | null }> {
  try {
    const firstStage = await fetchVotingDataFromApi('first')
    const secondStage = await fetchVotingDataFromApi('second')
    
    return {
      first: firstStage || generateFallbackData('first'),
      second: secondStage || generateFallbackData('second'),
    }
  } catch (error) {
    console.error('获取多阶段数据失败:', error)
    return {
      first: generateFallbackData('first'),
      second: generateFallbackData('second'),
    }
  }
} 