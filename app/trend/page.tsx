'use client'

import { useState, useEffect, useMemo } from 'react'
import { Calendar, TrendingUp, Download, Settings, Filter } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { LoadingCard, LoadingChart } from '@/components/ui/loading'
import { VotingStage, ArtistTrend, Artist } from '@/types'
import { formatDate, formatNumber, generateColors, cn } from '@/lib/utils'
import { fetchMultiStageData } from '@/lib/api'
import dynamic from 'next/dynamic'

// 动态导入 ECharts 组件
const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false })

// 确保页面可以静态生成
export const dynamicParams = false

export default function TrendPage() {
  const [loading, setLoading] = useState(true)
  const [stage, setStage] = useState<VotingStage>('first')
  const [dateRange, setDateRange] = useState<'7' | '14' | '30'>('7')
  const [selectedArtists, setSelectedArtists] = useState<string[]>([])
  const [chartType, setChartType] = useState<'votes' | 'rank'>('votes')
  const [artists, setArtists] = useState<Artist[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [availableCategories, setAvailableCategories] = useState<string[]>([])
  
  // 当用户切换分类时，重置已选艺人，避免跨分类选满 5 位导致无法勾选
  useEffect(() => {
    setSelectedArtists([])
  }, [selectedCategory])

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
          
          // 默认选择前5名
          setSelectedArtists(allArtists.slice(0, 5).map(artist => artist.id))
        } else {
          // 没有数据时的处理
          setAvailableCategories([])
          setArtists([])
          setSelectedArtists([])
        }
      } catch (error) {
        console.error('获取趋势数据失败:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [stage, dateRange])

  // 根据分类筛选艺人
  const filteredArtists = useMemo(() => {
    let result = artists
    
    // 按分类筛选
    if (selectedCategory) {
      result = result.filter(artist => artist.category === selectedCategory)
    }
    
    // 按选中状态筛选
    result = result.filter(artist => selectedArtists.includes(artist.id))
    
    return result
  }, [artists, selectedCategory, selectedArtists])

  // 生成图表配置
  const generateChartOption = () => {
    
    const colors = generateColors(filteredArtists.length)
    
    if (chartType === 'votes') {
      return {
        title: {
          text: '投票趋势分析（当前数据快照）',
          left: 'center'
        },
        tooltip: {
          trigger: 'axis',
          formatter: (params: any) => {
            let content = `<div>当前快照</div>`
            params.forEach((param: any, index: number) => {
              content += `<div style="color:${param.color}">
                ${param.seriesName}: ${param.value.toLocaleString()} 票
              </div>`
            })
            return content
          }
        },
        legend: {
          data: filteredArtists.map(artist => {
            // 作品类榜单在图例中显示作品名称
            if (artist.nameOfWork && ['PR70', 'PR71', 'PR72', 'PR73'].includes(artist.category)) {
              return `${artist.name} (${artist.nameOfWork})`
            }
            return artist.name
          }),
          bottom: 10
        },
        xAxis: {
          type: 'category',
          data: ['当前排名']
        },
        yAxis: {
          type: 'value',
          name: '票数',
          axisLabel: {
            formatter: (value: number) => value.toLocaleString()
          }
        },
        series: filteredArtists.map((artist, index) => ({
          name: artist.nameOfWork && ['PR70', 'PR71', 'PR72', 'PR73'].includes(artist.category) 
            ? `${artist.name} (${artist.nameOfWork})` 
            : artist.name,
          type: 'bar',
          data: [artist.currentVotes],
          itemStyle: {
            color: colors[index]
          }
        }))
      }
    } else {
      return {
        title: {
          text: '排名对比分析（当前数据快照）',
          left: 'center'
        },
        tooltip: {
          trigger: 'axis',
          formatter: (params: any) => {
            let content = `<div>当前排名</div>`
            params.forEach((param: any, index: number) => {
              content += `<div style="color:${param.color}">
                ${param.seriesName}: 第 ${param.value} 名
              </div>`
            })
            return content
          }
        },
        legend: {
          data: filteredArtists.map(artist => {
            // 作品类榜单在图例中显示作品名称
            if (artist.nameOfWork && ['PR70', 'PR71', 'PR72', 'PR73'].includes(artist.category)) {
              return `${artist.name} (${artist.nameOfWork})`
            }
            return artist.name
          }),
          bottom: 10
        },
        xAxis: {
          type: 'category',
          data: ['当前排名']
        },
        yAxis: {
          type: 'value',
          name: '排名',
          inverse: true,
          min: 1,
          axisLabel: {
            formatter: (value: number) => `第${value}名`
          }
        },
        series: filteredArtists.map((artist, index) => ({
          name: artist.nameOfWork && ['PR70', 'PR71', 'PR72', 'PR73'].includes(artist.category) 
            ? `${artist.name} (${artist.nameOfWork})` 
            : artist.name,
          type: 'bar',
          data: [artist.rankToday],
          itemStyle: {
            color: colors[index]
          }
        }))
      }
    }
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
          <div className="mt-8">
            <LoadingChart />
          </div>
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
          <h1 className="text-3xl font-bold text-gray-900">趋势分析</h1>
          <p className="mt-2 text-gray-600">
            分析艺人投票趋势和排名变化 | 阶段: {stage === 'first' ? '第一阶段' : '第二阶段'}
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

                {/* 图表类型 */}
                <select
                  value={chartType}
                  onChange={(e) => setChartType(e.target.value as 'votes' | 'rank')}
                  className="select-trigger w-32"
                >
                  <option value="votes">票数趋势</option>
                  <option value="rank">排名趋势</option>
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

        {/* 艺人选择 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              选择对比艺人 (最多5位)
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
                  <span className="text-xs text-gray-400 ml-2">
                    (共 {artists.filter(artist => artist.category === selectedCategory).length} 位艺人)
                  </span>
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 max-h-96 overflow-y-auto">
              {artists.filter(artist => selectedCategory && artist.category === selectedCategory).map(artist => (
                <label key={artist.id} className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-gray-50 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={selectedArtists.includes(artist.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        if (selectedArtists.length < 5) {
                          setSelectedArtists([...selectedArtists, artist.id])
                        }
                      } else {
                        setSelectedArtists(selectedArtists.filter(id => id !== artist.id))
                      }
                    }}
                    className="h-4 w-4 text-primary-600 rounded flex-shrink-0"
                  />
                  <div className="flex items-center space-x-2 flex-shrink-0">
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
                    <div className="min-w-0 flex-1">
                      <div className="font-medium truncate">
                        {artist.name}
                        {/* 作品类榜单显示作品名称 */}
                        {artist.nameOfWork && ['PR70', 'PR71', 'PR72', 'PR73'].includes(artist.category) && (
                          <span className="text-xs text-blue-600 ml-1">
                            ({artist.nameOfWork})
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">
                        #{artist.rankToday} · {formatNumber(artist.currentVotes)} 票
                      </div>
                      <div className="text-xs text-gray-400">
                        {(() => {
                          const categoryNames: { [key: string]: string } = {
                            'AM50': '年度男艺人', 'AM51': '年度女艺人', 'AM52': '年度男团',
                            'AM53': '年度女团', 'AM54': '最具人气新人-男', 'AM55': '最具人气新人-女',
                            'PR70': '年度歌曲', 'PR71': '年度专辑', 'PR72': '年度合作',
                            'PR73': '年度MV', 'PR74': 'JMA中国最具影响力华语流行男艺人'
                          }
                          return categoryNames[artist.category] || artist.category
                        })()}
                      </div>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 趋势图表 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {chartType === 'votes' ? '投票数据对比' : '排名数据对比'}
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
              注：当前显示的是最新数据快照，历史趋势功能需要积累多日数据后开放
            </p>
          </CardHeader>
          <CardContent>
            {selectedArtists.length > 0 && filteredArtists.length > 0 ? (
              <div className="chart-container">
                <ReactECharts
                  option={generateChartOption()}
                  style={{ height: '400px', width: '100%' }}
                  notMerge={true}
                  lazyUpdate={true}
                />
              </div>
            ) : (
              <div className="py-12 text-center text-gray-500">
                {selectedArtists.length === 0 ? '请选择要分析的艺人' : 
                 selectedCategory ? `当前分类"${(() => {
                   const categoryNames: { [key: string]: string } = {
                     'AM50': '年度男艺人', 'AM51': '年度女艺人', 'AM52': '年度男团',
                     'AM53': '年度女团', 'AM54': '最具人气新人-男', 'AM55': '最具人气新人-女',
                     'PR70': '年度歌曲', 'PR71': '年度专辑', 'PR72': '年度合作',
                     'PR73': '年度MV', 'PR74': 'JMA中国最具影响力华语流行男艺人'
                   }
                   return categoryNames[selectedCategory] || selectedCategory
                 })()}"中没有选中的艺人` : '请选择要分析的艺人'}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 