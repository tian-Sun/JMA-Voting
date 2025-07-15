// 投票阶段类型
export type VotingStage = 'first' | 'second'

// 投票分类类型
export type VotingCategory = string

// 艺人投票数据
export interface Artist {
  id: string
  name: string
  englishName?: string
  currentVotes: number
  previousVotes?: number
  rankToday: number
  rankYesterday?: number
  rankDelta: number // 正数上升，负数下降，0不变
  category: VotingCategory
  talentNumber?: string // 编号如 AM 50-01
  imageUrl?: string
  nameOfWork?: string | null
}

// 单日快照数据
export interface DailySnapshot {
  snapshot_date: string // YYYY-MM-DD
  stage: VotingStage
  total_votes?: number
  categories: {
    [category: string]: Artist[]
  }
}

// 历史数据点 - 用于趋势分析
export interface HistoricalDataPoint {
  date: string // YYYY-MM-DD
  snapshot: DailySnapshot
  collection_time: string // ISO timestamp
}

// 趋势分析数据点
export interface TrendDataPoint {
  date: string
  votes: number
  rank?: number
}

// 艺人趋势数据
export interface ArtistTrend {
  artistId: string
  artistName: string
  category: VotingCategory
  data: TrendDataPoint[]
}

// 榜单热度数据 - 增强版
export interface CategoryHeat {
  category: VotingCategory
  categoryName: string // 友好显示名称
  totalVotes: number
  topTenVotes: number
  topTenRatio: number
  dailyGrowth: number
  weeklyGrowth?: number
  averageVotesPerCandidate: number
  topThreeVotes: number
  competitionIntensity: number // 竞争激烈度 0-100
  lastUpdated: string
}

// 黑马艺人数据 - 增强版
export interface DarkHorse {
  artistId: string
  artistName: string
  englishName?: string
  category: VotingCategory
  categoryName: string
  currentRank: number
  previousRank: number
  rankChange: number // 排名变化幅度
  currentVotes: number
  previousVotes: number
  voteGrowth: number // 票数增长百分比
  voteGrowthAbsolute: number // 票数绝对增长
  imageUrl?: string
  talentNumber?: string
  nameOfWork?: string | null
}

// 热度分析历史数据
export interface HeatAnalysisHistory {
  date: string // YYYY-MM-DD
  stage: VotingStage
  categoryHeats: CategoryHeat[]
  darkHorses: DarkHorse[]
  totalVotes: number
  totalCandidates: number
  collection_time: string
}

// 筛选器状态
export interface FilterState {
  stage: VotingStage
  category: VotingCategory | 'all'
  searchKeyword: string
  dateRange: {
    start: string
    end: string
  }
}

// 图表配置
export interface ChartConfig {
  title: string
  xAxisType: 'category' | 'time'
  yAxisType: 'value' | 'log'
  series: Array<{
    name: string
    type: 'line' | 'bar' | 'pie'
    data: any[]
  }>
}

// API响应类型
export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
  timestamp: string
}

// 组件通用Props
export interface BaseComponentProps {
  className?: string
  children?: React.ReactNode
} 