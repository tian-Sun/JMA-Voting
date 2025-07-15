'use client'

import { useState, useEffect, useMemo } from 'react'
import { Search, Filter, Download, RefreshCw } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { LoadingCard, LoadingTable } from '@/components/ui/loading'
import { Artist, VotingStage, DailySnapshot } from '@/types'
import { fetchVotingDataFromApi } from '@/lib/api'
import { formatNumber, getRankChangeInfo, formatDate, cn } from '@/lib/utils'

// 分类代码到友好名称的映射
const CATEGORY_DISPLAY_NAMES: { [key: string]: string } = {
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

// 获取分类的友好显示名称
function getCategoryDisplayName(category: string): string {
  return CATEGORY_DISPLAY_NAMES[category] || category
}

// 判断是否为作品榜单
function isWorkCategory(category: string): boolean {
  return category.startsWith('PR')
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<DailySnapshot | null>(null)
  const [filteredArtists, setFilteredArtists] = useState<Artist[]>([])
  
  // 筛选状态
  const [stage, setStage] = useState<VotingStage>('first')
  const [category, setCategory] = useState<string>('')
  const [searchKeyword, setSearchKeyword] = useState('')
  
  // 加载数据
  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      try {
        const snapshot = await fetchVotingDataFromApi(stage)
        setData(snapshot)
      } catch (error) {
        console.error('加载数据失败:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [stage])

  // 获取分类列表
  const categories = useMemo(() => {
    if (!data) return []
    return Object.keys(data.categories)
  }, [data])

  // 当数据加载完成且没有选择分类时，默认选择第一个分类
  useEffect(() => {
    if (data && categories.length > 0 && !category) {
      setCategory(categories[0])
    }
  }, [data, categories, category])

  // 获取当前分类的艺人数据
  const categoryArtists = useMemo(() => {
    if (!data || !category) return []
    return data.categories[category] || []
  }, [data, category])

  // 应用筛选条件
  useEffect(() => {
    let filtered = categoryArtists

    // 关键词搜索
    if (searchKeyword.trim()) {
      const keyword = searchKeyword.toLowerCase()
      filtered = filtered.filter(artist => 
        artist.name.toLowerCase().includes(keyword) ||
        (artist.englishName && artist.englishName.toLowerCase().includes(keyword)) ||
        (artist.nameOfWork && artist.nameOfWork.toLowerCase().includes(keyword))
      )
    }

    setFilteredArtists(filtered)
  }, [categoryArtists, searchKeyword])

  // 导出CSV功能
  const handleExport = () => {
    if (!filteredArtists.length) return
    
    const categoryName = getCategoryDisplayName(category)
    const isWorkList = isWorkCategory(category)
    
    const headers = isWorkList 
      ? ['排名', '艺人名', '英文名', '作品名', '编号', '当前票数', '昨日排名', '排名变化']
      : ['排名', '艺人名', '英文名', '编号', '当前票数', '昨日排名', '排名变化']
      
    const csvContent = [
      headers.join(','),
      ...filteredArtists.map(artist => {
        const baseData = [
          artist.rankToday,
          artist.name,
          artist.englishName || '-',
        ]
        
        if (isWorkList) {
          baseData.push(artist.nameOfWork || '-')
        }
        
        baseData.push(
          artist.talentNumber || '-',
          artist.currentVotes,
          artist.rankYesterday || '-',
          artist.rankDelta || 0
        )
        
        return baseData.join(',')
      })
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `${categoryName}_Top排行榜_${formatDate(new Date())}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <LoadingCard title="正在加载榜单数据..." description="请稍候" />
          <div className="mt-8">
            <LoadingTable columns={6} rows={10} />
          </div>
        </div>
      </div>
    )
  }

  if (!data || !category) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-gray-500">暂无数据</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const categoryName = getCategoryDisplayName(category)
  const isWorkList = isWorkCategory(category)

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 页面头部 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">{categoryName} - Top排行榜</h1>
          <p className="mt-2 text-gray-600">
            数据更新时间: {formatDate(data.snapshot_date)} | 阶段: {stage === 'first' ? '第一阶段' : '第二阶段'} | 当前分类候选{isWorkList ? '作品' : '人'}: {categoryArtists.length}{isWorkList ? '个' : '名'}
          </p>
        </div>

        {/* 筛选控制 */}
        <Card className="mb-6">
          <CardContent className="py-4">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-4 flex-1">
                {/* 阶段切换 */}
                <div className="flex space-x-2">
                  <button
                    onClick={() => setStage('first')}
                    className={cn(
                      'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                      stage === 'first'
                        ? 'bg-primary-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    )}
                  >
                    第一阶段
                  </button>
                  <button
                    onClick={() => setStage('second')}
                    className={cn(
                      'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                      stage === 'second'
                        ? 'bg-primary-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    )}
                  >
                    第二阶段
                  </button>
                </div>

                {/* 分类选择 */}
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="select-trigger w-64"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{getCategoryDisplayName(cat)}</option>
                  ))}
                </select>

                {/* 搜索框 */}
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder={isWorkList ? "搜索艺人名或作品名..." : "搜索艺人名..."}
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    className="search-input pl-10"
                  />
                </div>
              </div>

              {/* 操作按钮 */}
              <div className="flex gap-2">
                <button
                  onClick={handleExport}
                  className="btn-secondary flex items-center gap-2"
                  disabled={!filteredArtists.length}
                >
                  <Download className="w-4 h-4" />
                  导出CSV
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="btn-secondary flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  刷新数据
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="py-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {formatNumber(categoryArtists.length)}
                </div>
                <div className="text-sm text-gray-500">候选{isWorkList ? '作品' : '人'}总数</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {formatNumber(filteredArtists.length)}
                </div>
                <div className="text-sm text-gray-500">当前显示</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {formatNumber(categoryArtists.reduce((sum, artist) => sum + artist.currentVotes, 0))}
                </div>
                <div className="text-sm text-gray-500">分类总票数</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-6">
              <div className="flex justify-center">
                {filteredArtists.length > 0 && filteredArtists[0]?.rankToday === 1 ? (
                  <div className="flex items-center space-x-3">
                    {/* 第一名头像 */}
                    {filteredArtists[0].imageUrl && (
                      <img 
                        src={filteredArtists[0].imageUrl} 
                        alt={filteredArtists[0].name}
                        className="w-12 h-12 rounded-full object-cover border-2 border-yellow-400 shadow-lg flex-shrink-0"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.style.display = 'none'
                        }}
                      />
                    )}
                    {/* 第一名信息 */}
                    <div className="text-left">
                      <div className="text-sm font-bold text-yellow-600">🥇 第一名</div>
                      <div className="font-medium text-gray-900 text-sm">{filteredArtists[0].name}</div>
                      {isWorkList && filteredArtists[0].nameOfWork && (
                        <div className="text-xs text-gray-600">《{filteredArtists[0].nameOfWork}》</div>
                      )}
                      <div className="text-xs text-green-600 font-medium">
                        {formatNumber(filteredArtists[0].currentVotes)} 票
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-400">-</div>
                    <div className="text-sm text-gray-500">暂无第一名</div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 排行榜表格 */}
        <Card>
          <CardHeader>
            <CardTitle>{categoryName} - Top {categoryArtists.length} 完整排行榜</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="table-container max-h-[600px] overflow-y-auto scrollbar-thin">
              <table className="table">
                <thead className="table-header sticky top-0 bg-white">
                  <tr>
                    <th className="table-head">排名</th>
                    <th className="table-head">{isWorkList ? '创作者/艺人' : '艺人'}</th>
                    {isWorkList && <th className="table-head">作品名称</th>}
                    <th className="table-head">编号</th>
                    <th className="table-head">当前票数</th>
                    <th className="table-head">昨日排名</th>
                    <th className="table-head">排名变化</th>
                  </tr>
                </thead>
                <tbody className="table-body">
                  {filteredArtists.map((artist) => {
                    const rankChange = getRankChangeInfo(artist.rankDelta)
                    
                    return (
                      <tr key={artist.id} className="table-row">
                        <td className="table-cell">
                          <div className="flex items-center">
                            <span className={cn(
                              'font-medium text-lg',
                              artist.rankToday <= 3 && 'text-yellow-600 font-bold',
                              artist.rankToday <= 10 && artist.rankToday > 3 && 'text-blue-600 font-semibold'
                            )}>
                              #{artist.rankToday}
                            </span>
                            {artist.rankToday <= 3 && (
                              <span className="ml-2 text-yellow-500">
                                {artist.rankToday === 1 ? '🥇' : artist.rankToday === 2 ? '🥈' : '🥉'}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="table-cell">
                          <div className="flex items-center space-x-3">
                            {artist.imageUrl && (
                              <img 
                                src={artist.imageUrl} 
                                alt={artist.name}
                                className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement
                                  target.style.display = 'none'
                                }}
                              />
                            )}
                            <div>
                              <div className="font-medium text-gray-900">{artist.name}</div>
                              {artist.englishName && artist.englishName !== artist.name && (
                                <div className="text-sm text-gray-500">{artist.englishName}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        {isWorkList && (
                          <td className="table-cell">
                            <div className="font-medium text-gray-900">
                              {artist.nameOfWork || '-'}
                            </div>
                          </td>
                        )}
                        <td className="table-cell">
                          <span className="text-xs text-gray-500 font-mono">
                            {artist.talentNumber}
                          </span>
                        </td>
                        <td className="table-cell">
                          <div className="font-medium text-lg">{formatNumber(artist.currentVotes)}</div>
                        </td>
                        <td className="table-cell">
                          {artist.rankYesterday ? `#${artist.rankYesterday}` : '-'}
                        </td>
                        <td className="table-cell">
                          <span className={cn('rank-change', rankChange.className)}>
                            {rankChange.text}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 