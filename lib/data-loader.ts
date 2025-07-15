import pako from 'pako'
import { DailySnapshot, VotingStage, Artist } from '@/types'

// 数据缓存
const cache = new Map<string, DailySnapshot>()

// 基础路径配置
const BASE_PATH = process.env.NODE_ENV === 'production' ? '/JMA-Voting' : ''

// API基础地址
const API_BASE_URL = 'https://lite-be.ivideocloud.cn/api/v1/fanfever'

// 加载并解压缩单日数据
export async function loadDailyData(date: string, stage: VotingStage): Promise<DailySnapshot | null> {
  const cacheKey = `${date}_${stage}`
  
  // 检查缓存
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey)!
  }
  
  try {
    const response = await fetch(`${BASE_PATH}/data/${date}_${stage}.json.gz`)
    
    if (!response.ok) {
      console.warn(`数据文件不存在: ${date}_${stage}.json.gz`)
      return null
    }
    
    const arrayBuffer = await response.arrayBuffer()
    const compressed = new Uint8Array(arrayBuffer)
    const decompressed = pako.ungzip(compressed, { to: 'string' })
    const data: DailySnapshot = JSON.parse(decompressed)
    
    // 缓存数据
    cache.set(cacheKey, data)
    
    return data
  } catch (error) {
    console.error(`加载数据失败: ${date}_${stage}`, error)
    return null
  }
}

// 批量加载多日数据
export async function loadMultipleDaysData(
  dates: string[],
  stage: VotingStage
): Promise<DailySnapshot[]> {
  const promises = dates.map(date => loadDailyData(date, stage))
  const results = await Promise.all(promises)
  return results.filter(data => data !== null) as DailySnapshot[]
}

// 生成日期范围
export function generateDateRange(startDate: string, endDate: string): string[] {
  const dates: string[] = []
  const start = new Date(startDate)
  const end = new Date(endDate)
  
  for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
    dates.push(date.toISOString().split('T')[0])
  }
  
  return dates
}

// 获取可用的数据日期列表
export async function getAvailableDataDates(stage: VotingStage): Promise<string[]> {
  try {
    const response = await fetch(`${BASE_PATH}/data/manifest.json`)
    
    if (!response.ok) {
      // 如果没有manifest文件，使用默认的日期范围
      return generateDateRange('2025-07-18', '2025-08-29')
    }
    
    const manifest = await response.json()
    return manifest[stage] || []
  } catch (error) {
    console.error('获取数据清单失败:', error)
    return generateDateRange('2025-07-18', '2025-08-29')
  }
}

// 合并多日数据，计算趋势
export function mergeDailyDataForTrend(dailySnapshots: DailySnapshot[]): Map<string, Artist[]> {
  const artistTrends = new Map<string, Artist[]>()
  
  dailySnapshots.forEach(snapshot => {
    Object.values(snapshot.categories).forEach(artists => {
      artists.forEach(artist => {
        if (!artistTrends.has(artist.id)) {
          artistTrends.set(artist.id, [])
        }
        artistTrends.get(artist.id)!.push({
          ...artist,
          // 添加日期信息用于趋势分析
          snapshot_date: snapshot.snapshot_date
        } as any)
      })
    })
  })
  
  return artistTrends
}

// 计算排名变化
export function calculateRankChanges(current: Artist[], previous: Artist[]): Artist[] {
  const previousRanks = new Map<string, number>()
  previous.forEach(artist => {
    previousRanks.set(artist.id, artist.rankToday)
  })
  
  return current.map(artist => ({
    ...artist,
    rankYesterday: previousRanks.get(artist.id),
    rankDelta: previousRanks.has(artist.id)
      ? (previousRanks.get(artist.id)! - artist.rankToday)
      : 0
  }))
}

// 清理缓存
export function clearCache(): void {
  cache.clear()
}

// 获取缓存大小
export function getCacheSize(): number {
  return cache.size
} 