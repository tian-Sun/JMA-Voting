'use client'

import { useState, useEffect, useMemo } from 'react'
import { Calendar, TrendingUp, Download, Settings, Filter } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { LoadingCard } from '@/components/ui/loading'
import { VotingStage, Artist } from '@/types'
import { formatDate, formatNumber, cn } from '@/lib/utils'
import { fetchMultiStageData, fetchArtistTrendData } from '@/lib/api'
import { PlatformVotesSummary } from '@/components/platform-votes'
import { MiniTrendChart } from '@/components/ui/trend-chart'

// 确保页面可以静态生成
export const dynamicParams = false

export default function TrendPage() {
  const [loading, setLoading] = useState(true)
  const [stage, setStage] = useState<VotingStage>('first')
  const [dateRange, setDateRange] = useState<'7' | '14' | '30'>('7')
  const [artists, setArtists] = useState<Artist[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [availableCategories, setAvailableCategories] = useState<string[]>([])
  const [artistTrends, setArtistTrends] = useState<{ [artistId: string]: { date: string; rank: number; votes: number }[] }>({})
  const [loadingTrends, setLoadingTrends] = useState<{ [artistId: string]: boolean }>({})

  // 趋势数据将从真实API获取，不使用模拟数据

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      try {
        const data = await fetchMultiStageData()
        const stageData = data[stage]
        
        if (stageData) {
          // 获取所有可用的分类
          const categories = Object.keys(stageData.categories)
          setAvailableCategories(categories)
          
          // 默认选择第一个分类
          if (categories.length > 0 && !selectedCategory) {
            setSelectedCategory(categories[0])
          }
          
          // 获取所有艺人
          const allArtists: Artist[] = []
          Object.values(stageData.categories).forEach(categoryArtists => {
            allArtists.push(...categoryArtists)
          })
          
          // 按票数排序，优先显示有票数的艺人
          allArtists.sort((a, b) => {
            if (a.currentVotes === b.currentVotes) {
              return a.rankToday - b.rankToday
            }
            return b.currentVotes - a.currentVotes
          })
          
          setArtists(allArtists) // 不限制数量，显示所有艺人
        } else {
          // 没有数据时的处理
          setAvailableCategories([])
          setArtists([])
        }
      } catch (error) {
        console.error('获取趋势数据失败:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [stage, dateRange])

  // 根据分类筛选艺人 - 显示当前分类下的所有艺人
  const filteredArtists = useMemo(() => {
    if (!selectedCategory) return []
    
    // 按分类筛选，显示该分类下的所有艺人
    return artists.filter(artist => artist.category === selectedCategory)
  }, [artists, selectedCategory])

  // 当筛选后的艺人数据变化时，自动加载趋势数据
  useEffect(() => {
    if (filteredArtists.length > 0) {
      loadAllArtistTrends(filteredArtists)
    }
  }, [filteredArtists, stage, dateRange])

  // 加载艺人趋势数据
  const loadArtistTrend = async (artistId: string) => {
    if (artistTrends[artistId] || loadingTrends[artistId]) return
    
    setLoadingTrends(prev => ({ ...prev, [artistId]: true }))
    
    try {
      const trendData = await fetchArtistTrendData(stage, artistId, parseInt(dateRange))
      setArtistTrends(prev => ({ ...prev, [artistId]: trendData }))
    } catch (error) {
      console.error(`加载 ${artistId} 趋势数据失败:`, error)
    } finally {
      setLoadingTrends(prev => ({ ...prev, [artistId]: false }))
    }
  }

  // 批量加载所有艺人的趋势数据
  const loadAllArtistTrends = async (artists: Artist[]) => {
    const promises = artists.map(artist => loadArtistTrend(artist.id))
    await Promise.allSettled(promises)
  }



  // 导出数据
  const handleExport = () => {
    if (!filteredArtists.length) return

    const headers = ['艺人名称', '分类', '当前票数', '当前排名']
    const rows: string[][] = []
    
    filteredArtists.forEach(artist => {
      const row = [
        artist.nameOfWork && ['PR70', 'PR71', 'PR72', 'PR73'].includes(artist.category) 
          ? `${artist.name} (${artist.nameOfWork})` 
          : artist.name,
        artist.category,
        artist.currentVotes?.toString() || '0',
        artist.rankToday?.toString() || '0'
      ]
      rows.push(row)
    })

    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `趋势数据_${stage === 'first' ? '第一阶段' : '第二阶段'}_${formatDate(new Date())}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <LoadingCard title="正在加载趋势数据..." description="请稍候" />
        </div>
      </div>
    )
  }

  // 无数据状态
  if (!artists.length) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* 页面头部 */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">趋势分析</h1>
            <p className="mt-2 text-gray-600">
              分析艺人投票趋势和排名变化 | 阶段: {stage === 'first' ? '第一阶段' : '第二阶段'}
            </p>
          </div>

          {/* 无数据提示 */}
          <Card className="mb-6">
            <CardContent className="py-12 text-center">
              <div className="text-gray-400 mb-4">
                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">暂无数据</h3>
              <p className="text-gray-600 mb-6">
                {stage === 'first' ? '第一阶段' : '第二阶段'} 暂无投票数据，请先收集数据
              </p>
              <div className="space-y-2">
                <p className="text-sm text-gray-500">
                  请运行以下命令收集最新数据：
                </p>
                <div className="bg-gray-100 p-3 rounded-lg font-mono text-sm">
                  npm run collect:{stage}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 页面头部 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <TrendingUp className="w-8 h-8 text-blue-500" />
            艺人趋势分析
          </h1>
          <p className="mt-2 text-gray-600">
            可视化艺人排名和票数变化趋势 | 阶段: {stage === 'first' ? '第一阶段' : '第二阶段'} | 时间范围: 近{dateRange}天
          </p>
        </div>

        {/* 控制面板 */}
        <Card className="mb-6">
          <CardContent className="py-4">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
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

                {/* 时间范围 */}
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value as '7' | '14' | '30')}
                  className="select-trigger w-32"
                >
                  <option value="7">近7天</option>
                  <option value="14">近14天</option>
                  <option value="30">近30天</option>
                </select>



                {/* 分类筛选 */}
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="select-trigger w-48"
                >
                  {availableCategories.map(category => {
                    const categoryNames: { [key: string]: string } = {
                      'AM50': '年度男艺人',
                      'AM51': '年度女艺人', 
                      'AM52': '年度男团',
                      'AM53': '年度女团',
                      'AM54': '最具人气新人-男',
                      'AM55': '最具人气新人-女',
                      'PR70': '年度歌曲',
                      'PR71': '年度专辑',
                      'PR72': '年度合作',
                      'PR73': '年度MV',
                      'PR74': 'JMA中国最具影响力华语流行男艺人'
                    }
                    return (
                      <option key={category} value={category}>
                        {categoryNames[category] || category}
                      </option>
                    )
                  })}
                </select>
              </div>

              {/* 操作按钮 */}
              <div className="flex space-x-2">
                <button
                  onClick={handleExport}
                  className="btn btn-outline flex items-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>导出</span>
                </button>
              </div>
            </div>
          </CardContent>
        </Card>



        {/* 趋势表格 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-500" />
              艺人趋势分析
              {selectedCategory && (
                <span className="text-sm font-normal text-gray-500">
                  - {(() => {
                    const categoryNames: { [key: string]: string } = {
                      'AM50': '年度男艺人', 'AM51': '年度女艺人', 'AM52': '年度男团',
                      'AM53': '年度女团', 'AM54': '最具人气新人-男', 'AM55': '最具人气新人-女',
                      'PR70': '年度歌曲', 'PR71': '年度专辑', 'PR72': '年度合作',
                      'PR73': '年度MV', 'PR74': 'JMA中国最具影响力华语流行男艺人'
                    }
                    return categoryNames[selectedCategory] || selectedCategory
                  })()}
                </span>
              )}
            </CardTitle>
            <p className="text-sm text-gray-500">
              趋势图自动加载显示历史排名变化。当前只有单日数据，明天开始将显示趋势线。点击趋势图可查看详细的历史排名和票数变化。绿色箭头表示排名上升，红色箭头表示排名下降。
            </p>
          </CardHeader>
          <CardContent>
            {filteredArtists.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-200">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-200 px-4 py-2 text-left font-medium text-gray-700">
                        名称
                      </th>
                      <th className="border border-gray-200 px-4 py-2 text-center font-medium text-gray-700">
                        当前排名
                      </th>
                      <th className="border border-gray-200 px-4 py-2 text-center font-medium text-gray-700">
                        当前票数
                      </th>
                      <th className="border border-gray-200 px-4 py-2 text-center font-medium text-gray-700">
                        票数来源
                      </th>
                      <th className="border border-gray-200 px-4 py-2 text-center font-medium text-gray-700">
                        趋势图
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredArtists.map((artist, index) => (
                      <tr key={artist.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="border border-gray-200 px-4 py-3">
                          <div className="flex items-center space-x-3">
                            {artist.imageUrl && (
                              <img 
                                src={artist.imageUrl} 
                                alt={artist.name}
                                className="w-8 h-8 rounded-full object-cover border border-gray-200"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement
                                  target.style.display = 'none'
                                }}
                              />
                            )}
                            <div>
                              <div className="font-medium text-gray-900">
                                {artist.name}
                                {artist.nameOfWork && ['PR70', 'PR71', 'PR72', 'PR73'].includes(artist.category) && (
                                  <span className="text-xs text-blue-600 ml-1">
                                    ({artist.nameOfWork})
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-gray-500">
                                {artist.talentNumber}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="border border-gray-200 px-4 py-3 text-center">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            #{artist.rankToday}
                          </span>
                        </td>
                        <td className="border border-gray-200 px-4 py-3 text-center font-medium text-gray-900">
                          {formatNumber(artist.currentVotes)}
                        </td>
                        <td className="border border-gray-200 px-4 py-3 text-center">
                          {artist.platformVotes && artist.platformVotes.length > 0 ? (
                            <PlatformVotesSummary 
                              platformVotes={artist.platformVotes} 
                              totalVotes={artist.currentVotes}
                            />
                          ) : (
                            <span className="text-gray-400 text-sm">-</span>
                          )}
                        </td>
                        <td className="border border-gray-200 px-4 py-3 text-center">
                          <div className="flex justify-center">
                            {loadingTrends[artist.id] ? (
                              <div className="flex items-center justify-center w-16 h-8 bg-gray-100 rounded">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                              </div>
                            ) : (
                              <MiniTrendChart
                                data={artistTrends[artist.id] || []}
                                artistName={artist.name}
                                className="w-16 h-8"
                              />
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-12 text-center text-gray-500">
                {selectedCategory ? `当前分类"${(() => {
                  const categoryNames: { [key: string]: string } = {
                    'AM50': '年度男艺人', 'AM51': '年度女艺人', 'AM52': '年度男团',
                    'AM53': '年度女团', 'AM54': '最具人气新人-男', 'AM55': '最具人气新人-女',
                    'PR70': '年度歌曲', 'PR71': '年度专辑', 'PR72': '年度合作',
                    'PR73': '年度MV', 'PR74': 'JMA中国最具影响力华语流行男艺人'
                  }
                  return categoryNames[selectedCategory] || selectedCategory
                })()}"暂无数据` : '请选择要分析的分类'}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 