'use client'

import { useState, useEffect, useMemo } from 'react'

// 确保页面可以静态生成
export const dynamicParams = false
import { Flame, TrendingUp, Trophy, Star, Users, Zap, Crown, Activity } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { LoadingCard, LoadingChart } from '@/components/ui/loading'
import { VotingStage, HeatAnalysisHistory, CategoryHeat, DarkHorse } from '@/types'
import { formatNumber, formatDate, cn } from '@/lib/utils'
import { fetchHeatAnalysisData, fetchMultiDayHeatAnalysis, fetchCategoryTrendData } from '@/lib/api'
import dynamic from 'next/dynamic'

// 动态导入 ECharts 组件
const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false })

export default function HeatPage() {
  const [loading, setLoading] = useState(true)
  const [stage, setStage] = useState<VotingStage>('first')
  const [heatData, setHeatData] = useState<HeatAnalysisHistory | null>(null)
  const [multiDayData, setMultiDayData] = useState<HeatAnalysisHistory[]>([])
  const [trendData, setTrendData] = useState<any>(null)
  const [selectedMetric, setSelectedMetric] = useState<string>('totalVotes')
  const [trendViewMode, setTrendViewMode] = useState<'all' | 'single'>('all')
  const [selectedTrendCategory, setSelectedTrendCategory] = useState<string>('')

  // 加载热度分析数据
  useEffect(() => {
    async function loadHeatData() {
      setLoading(true)
      try {
        const [currentHeat, multiDayHeat, categoryTrend] = await Promise.all([
          fetchHeatAnalysisData(stage),
          fetchMultiDayHeatAnalysis(stage, 7),
          fetchCategoryTrendData(stage, 7)
        ])
        
        setHeatData(currentHeat)
        setMultiDayData(multiDayHeat)
        setTrendData(categoryTrend)
      } catch (error) {
        console.error('加载热度数据失败:', error)
      } finally {
        setLoading(false)
      }
    }
    
    loadHeatData()
  }, [stage])

  // 获取所有分类热度数据
  const filteredCategoryHeats = useMemo(() => {
    if (!heatData) return []
    return heatData.categoryHeats
  }, [heatData])

  // 生成分类热度对比图
  const generateCategoryHeatChart = () => {
    if (!heatData) return {}
    
    const categories = heatData.categoryHeats.map(cat => cat.categoryName)
    const totalVotes = heatData.categoryHeats.map(cat => cat.totalVotes)
    const topTenRatio = heatData.categoryHeats.map(cat => cat.topTenRatio)
    const dailyGrowth = heatData.categoryHeats.map(cat => cat.dailyGrowth)

    return {
      title: {
        text: '各分类热度对比',
        left: 'center',
        top: 10,
        textStyle: { fontSize: 16 }
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' }
      },
      legend: {
        data: ['总票数', 'Top10占比(%)', '日增长率(%)'],
        top: 40
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: '15%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: categories,
        axisLabel: {
          rotate: 45,
          fontSize: 10
        }
      },
      yAxis: [
        {
          type: 'value',
          name: '票数',
          position: 'left',
          axisLabel: {
            formatter: (value: number) => (value / 1000).toFixed(0) + 'K'
          }
        },
        {
          type: 'value',
          name: '百分比(%)',
          position: 'right',
          max: 100,
          axisLabel: {
            formatter: (value: number) => value + '%'
          }
        }
      ],
      series: [
        {
          name: '总票数',
          type: 'bar',
          data: totalVotes,
          itemStyle: { color: '#ef4444' },
          yAxisIndex: 0
        },
        {
          name: 'Top10占比(%)',
          type: 'line',
          data: topTenRatio,
          itemStyle: { color: '#3b82f6' },
          yAxisIndex: 1,
          smooth: true
        },
        {
          name: '日增长率(%)',
          type: 'line',
          data: dailyGrowth,
          itemStyle: { color: '#10b981' },
          yAxisIndex: 1,
          smooth: true
        }
      ]
    }
  }

  // 生成竞争激烈度雷达图
  const generateCompetitionRadar = () => {
    if (!heatData) return {}
    
    const indicator = heatData.categoryHeats.map(cat => ({
      name: cat.categoryName,
      max: 100
    }))
    
    const data = heatData.categoryHeats.map(cat => cat.competitionIntensity)
    
    return {
      title: {
        text: '竞争激烈度',
        left: 'center',
        top: 10,
        textStyle: { fontSize: 16 }
      },
      tooltip: {
        trigger: 'item',
        formatter: (params: any) => {
          return `${params.name}: ${params.value.toFixed(1)}`
        }
      },
      radar: {
        indicator: indicator.slice(0, 8), // 限制显示前8个分类
        center: ['50%', '55%'],
        radius: '65%'
      },
      series: [
        {
          type: 'radar',
          data: [
            {
              value: data.slice(0, 8),
              name: '竞争激烈度',
              itemStyle: { color: '#8b5cf6' },
              areaStyle: { opacity: 0.3 }
            }
          ]
        }
      ]
    }
  }

  // 生成总票数趋势图
  const generateTotalVotesTrend = () => {
    if (multiDayData.length === 0) return {}
    
    const dates = multiDayData.map(data => data.date.slice(5)) // MM-DD格式
    const totalVotes = multiDayData.map(data => data.totalVotes)
    
    return {
      title: {
        text: '总票数趋势',
        left: 'center',
        top: 10,
        textStyle: { fontSize: 16 }
      },
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          const date = params[0].axisValue
          const votes = params[0].value
          return `${date}<br/>总票数: ${formatNumber(votes)}`
        }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: '15%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: dates,
        boundaryGap: false
      },
      yAxis: {
        type: 'value',
        name: '票数',
        axisLabel: {
          formatter: (value: number) => (value / 1000).toFixed(0) + 'K'
        }
      },
      series: [
        {
          name: '总票数',
          type: 'line',
          data: totalVotes,
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          lineStyle: { width: 3, color: '#ef4444' },
          itemStyle: { color: '#ef4444' },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(239, 68, 68, 0.4)' },
                { offset: 1, color: 'rgba(239, 68, 68, 0.1)' }
              ]
            }
          }
        }
      ]
    }
  }

  // 生成榜单趋势对比图
  const generateCategoryTrendsChart = () => {
    if (!trendData || trendData.dates.length === 0) return {}

    const colors = [
      '#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', 
      '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16', '#f43f5e'
    ]

    const getMetricData = (categoryData: any) => {
      switch (selectedMetric) {
        case 'totalVotes':
          return categoryData.totalVotes
        case 'dailyGrowth':
          return categoryData.dailyGrowth
        case 'competitionIntensity':
          return categoryData.competitionIntensity
        case 'averageVotes':
          return categoryData.averageVotes
        case 'topTenRatio':
          return categoryData.topTenRatio
        default:
          return categoryData.totalVotes
      }
    }

    const getMetricConfig = () => {
      const isMultiple = trendViewMode === 'all'
      const isSingleDay = trendData && trendData.dates.length === 1
      const prefix = isMultiple ? '各榜单' : '榜单'
      const suffix = isSingleDay ? '数据' : '趋势'
      
      switch (selectedMetric) {
        case 'totalVotes':
          return {
            title: `${prefix}总票数${suffix}`,
            yAxisName: '票数',
            formatter: (value: number) => formatNumber(value)
          }
        case 'dailyGrowth':
          return {
            title: `${prefix}日增长率${suffix}`,
            yAxisName: '增长率(%)',
            formatter: (value: number) => value.toFixed(1) + '%'
          }
        case 'competitionIntensity':
          return {
            title: `${prefix}竞争激烈度${suffix}`,
            yAxisName: '激烈度',
            formatter: (value: number) => value.toFixed(1)
          }
        case 'averageVotes':
          return {
            title: `${prefix}平均票数${suffix}`,
            yAxisName: '平均票数',
            formatter: (value: number) => formatNumber(value)
          }
        case 'topTenRatio':
          return {
            title: `${prefix}Top10占比${suffix}`,
            yAxisName: '占比(%)',
            formatter: (value: number) => value.toFixed(1) + '%'
          }
        default:
          return {
            title: `${prefix}总票数${suffix}`,
            yAxisName: '票数',
            formatter: (value: number) => formatNumber(value)
          }
      }
    }

    const metricConfig = getMetricConfig()
    
    // 如果是单榜单视图
    if (trendViewMode === 'single' && selectedTrendCategory) {
      const categoryData = trendData.trendsData[selectedTrendCategory]
      if (!categoryData) return {}

      const data = getMetricData(categoryData)
      const isSinglePoint = data.length === 1

      const series = [{
        name: categoryData.categoryName,
        type: 'line',
        data: data,
        smooth: !isSinglePoint,
        symbol: 'circle',
        symbolSize: isSinglePoint ? 12 : 6, // 单点时增大符号
        lineStyle: { 
          width: isSinglePoint ? 0 : 3, // 单点时不显示线条
          color: '#8b5cf6' 
        },
        itemStyle: { color: '#8b5cf6' },
        showSymbol: true,
        areaStyle: isSinglePoint ? null : {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(139, 92, 246, 0.3)' },
              { offset: 1, color: 'rgba(139, 92, 246, 0.1)' }
            ]
          }
        }
      }]

      return {
        title: {
          text: `${categoryData.categoryName} - ${metricConfig.title}${isSinglePoint ? ' (单日数据点)' : ''}`,
          left: 'center',
          top: 10,
          textStyle: { fontSize: 16 }
        },
        tooltip: {
          trigger: 'axis',
          formatter: (params: any) => {
            const date = params[0].axisValue
            const value = params[0].value
            return `${date}<br/>${categoryData.categoryName}: ${metricConfig.formatter(value)}`
          }
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          top: '15%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          data: trendData.dates,
          boundaryGap: false
        },
        yAxis: {
          type: 'value',
          name: metricConfig.yAxisName,
          axisLabel: {
            formatter: selectedMetric === 'totalVotes' || selectedMetric === 'averageVotes' 
              ? (value: number) => (value / 1000).toFixed(0) + 'K'
              : undefined
          }
        },
        series
      }
    }

    // 多榜单对比视图
    const series = trendData.categories.map((category: string, index: number) => {
      const categoryData = trendData.trendsData[category]
      if (!categoryData) return null

      const data = getMetricData(categoryData)
      const isSinglePoint = data.length === 1

      return {
        name: categoryData.categoryName,
        type: 'line',
        data: data,
        smooth: !isSinglePoint,
        symbol: 'circle',
        symbolSize: isSinglePoint ? 8 : 4, // 单点时增大符号
        lineStyle: { 
          width: isSinglePoint ? 0 : 2, // 单点时不显示线条
          color: colors[index % colors.length] 
        },
        itemStyle: { color: colors[index % colors.length] },
        showSymbol: true, // 确保显示数据点
      }
    }).filter(Boolean)

    return {
      title: {
        text: metricConfig.title,
        left: 'center',
        top: 10,
        textStyle: { fontSize: 16 }
      },
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          const date = params[0].axisValue
          let content = `${date}<br/>`
          params.forEach((param: any) => {
            content += `${param.seriesName}: ${metricConfig.formatter(param.value)}<br/>`
          })
          return content
        }
      },
      legend: {
        type: 'scroll',
        orient: 'horizontal',
        top: 35,
        left: 'center',
        width: '80%'
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: '20%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: trendData.dates,
        boundaryGap: false
      },
      yAxis: {
        type: 'value',
        name: metricConfig.yAxisName,
        axisLabel: {
          formatter: selectedMetric === 'totalVotes' || selectedMetric === 'averageVotes' 
            ? (value: number) => (value / 1000).toFixed(0) + 'K'
            : undefined
        }
      },
      series
    }
  }

  // 获取指标选项
  const getMetricOptions = () => [
    { value: 'totalVotes', label: '总票数' },
    { value: 'dailyGrowth', label: '日增长率' },
    { value: 'competitionIntensity', label: '竞争激烈度' },
    { value: 'averageVotes', label: '平均票数' },
    { value: 'topTenRatio', label: 'Top10占比' }
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <LoadingCard title="正在加载热度分析数据..." description="请稍候" />
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <LoadingChart />
            <LoadingChart />
          </div>
        </div>
      </div>
    )
  }

  if (!heatData) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card>
            <CardContent className="py-12 text-center">
              <Flame className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">等待真实数据</h3>
              <p className="text-gray-500 mb-4">暂无API数据，请稍后再试</p>
              <p className="text-sm text-gray-400">系统每天中午12:05自动收集最新数据</p>
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
            <Flame className="w-8 h-8 text-orange-500" />
            榜单热度分析
          </h1>
          <p className="mt-2 text-gray-600">
            数据更新时间: {formatDate(heatData.date)} | 阶段: {stage === 'first' ? '第一阶段' : '第二阶段'} | 总票数: {formatNumber(heatData.totalVotes)}
          </p>
          {trendData && trendData.dates && trendData.dates.length > 0 && (
            <p className="mt-1 text-sm text-green-600">
              ✅ 趋势数据基于真实历史数据（{trendData.dates.length}天）
              {trendData.dates.length === 1 && ' - 单日数据点'}
            </p>
          )}
        </div>

        {/* 控制面板 */}
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
                        ? 'bg-orange-500 text-white'
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
                        ? 'bg-orange-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    )}
                  >
                    第二阶段
                  </button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 统计概览 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="py-6">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Users className="w-6 h-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <div className="text-2xl font-bold text-gray-900">
                    {formatNumber(heatData.totalCandidates)}
                  </div>
                  <div className="text-sm text-gray-500">总候选人数</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="py-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Activity className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <div className="text-2xl font-bold text-gray-900">
                    {formatNumber(heatData.totalVotes)}
                  </div>
                  <div className="text-sm text-gray-500">总票数</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="py-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Trophy className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <div className="text-2xl font-bold text-gray-900">
                    {heatData.categoryHeats.length}
                  </div>
                  <div className="text-sm text-gray-500">活跃分类</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="py-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Zap className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <div className="text-2xl font-bold text-gray-900">
                    {heatData.darkHorses.length}
                  </div>
                  <div className="text-sm text-gray-500">黑马艺人</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 图表区域 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* 分类热度对比 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-orange-500" />
                分类热度对比
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ReactECharts
                  option={generateCategoryHeatChart()}
                  style={{ height: '100%', width: '100%' }}
                />
              </div>
            </CardContent>
          </Card>

          {/* 竞争激烈度 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-500" />
                竞争激烈度
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ReactECharts
                  option={generateCompetitionRadar()}
                  style={{ height: '100%', width: '100%' }}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 总票数趋势 */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-500" />
              总票数趋势 (最近7天)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ReactECharts
                option={generateTotalVotesTrend()}
                style={{ height: '100%', width: '100%' }}
              />
            </div>
          </CardContent>
        </Card>

        {/* 榜单趋势对比 */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-purple-500" />
              各榜单变化趋势 {trendData && trendData.dates.length > 0 ? `(${trendData.dates.length === 1 ? '当日数据' : `最近${trendData.dates.length}天`})` : ''}
            </CardTitle>
            <div className="mt-3 space-y-3">
              {/* 视图模式切换 */}
              <div className="flex flex-wrap gap-2 items-center">
                <span className="text-sm text-gray-600 mr-2">视图模式:</span>
                <button
                  onClick={() => {
                    setTrendViewMode('all')
                    setSelectedTrendCategory('')
                  }}
                  className={cn(
                    'px-3 py-1 rounded-full text-xs font-medium transition-colors',
                    trendViewMode === 'all'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  )}
                >
                  全部对比
                </button>
                <button
                  onClick={() => {
                    setTrendViewMode('single')
                    if (trendData && trendData.categories.length > 0) {
                      setSelectedTrendCategory(trendData.categories[0])
                    }
                  }}
                  className={cn(
                    'px-3 py-1 rounded-full text-xs font-medium transition-colors',
                    trendViewMode === 'single'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  )}
                >
                  单榜详情
                </button>
              </div>

              {/* 榜单选择器 (单榜模式下显示) */}
              {trendViewMode === 'single' && trendData && (
                <div className="flex flex-wrap gap-2 items-center">
                  <span className="text-sm text-gray-600 mr-2">选择榜单:</span>
                  <select
                    value={selectedTrendCategory}
                    onChange={(e) => setSelectedTrendCategory(e.target.value)}
                    className="px-3 py-1 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    {trendData.categories.map((category: string) => {
                      const categoryData = trendData.trendsData[category]
                      return (
                        <option key={category} value={category}>
                          {categoryData?.categoryName || category}
                        </option>
                      )
                    })}
                  </select>
                </div>
              )}

              {/* 指标选择 */}
              <div className="flex flex-wrap gap-2 items-center">
                <span className="text-sm text-gray-600 mr-2">指标选择:</span>
                {getMetricOptions().map(option => (
                  <button
                    key={option.value}
                    onClick={() => setSelectedMetric(option.value)}
                    className={cn(
                      'px-3 py-1 rounded-full text-xs font-medium transition-colors',
                      selectedMetric === option.value
                        ? 'bg-purple-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {trendData && trendData.dates.length > 0 ? (
              <div className="h-96">
                <ReactECharts
                  option={generateCategoryTrendsChart()}
                  style={{ height: '100%', width: '100%' }}
                />
              </div>
            ) : (
              <div className="h-96 flex items-center justify-center text-gray-500">
                                  <div className="text-center">
                    <Activity className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-lg font-medium mb-2">暂无历史数据</p>
                    <p className="text-sm">等待系统收集数据</p>
                    <p className="text-xs mt-2 text-gray-400">系统每天中午12:05自动收集数据</p>
                  </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 分类详情列表 */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-500" />
              分类详情
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">分类</th>
                    <th className="text-right py-3 px-4">总票数</th>
                    <th className="text-right py-3 px-4">Top10占比</th>
                    <th className="text-right py-3 px-4">日增长率</th>
                    <th className="text-right py-3 px-4">竞争激烈度</th>
                    <th className="text-right py-3 px-4">平均票数</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCategoryHeats.map((cat, index) => (
                    <tr key={cat.category} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="font-medium">{cat.categoryName}</div>
                        <div className="text-sm text-gray-500">{cat.category}</div>
                      </td>
                      <td className="text-right py-3 px-4 font-medium">
                        {formatNumber(cat.totalVotes)}
                      </td>
                      <td className="text-right py-3 px-4">
                        <span className={cn(
                          'px-2 py-1 rounded text-xs font-medium',
                          cat.topTenRatio > 80 ? 'bg-red-100 text-red-800' :
                          cat.topTenRatio > 60 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        )}>
                          {cat.topTenRatio.toFixed(1)}%
                        </span>
                      </td>
                      <td className="text-right py-3 px-4">
                        <span className={cn(
                          'px-2 py-1 rounded text-xs font-medium',
                          cat.dailyGrowth > 0 ? 'bg-green-100 text-green-800' :
                          cat.dailyGrowth < 0 ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        )}>
                          {cat.dailyGrowth > 0 ? '+' : ''}{cat.dailyGrowth.toFixed(1)}%
                        </span>
                      </td>
                      <td className="text-right py-3 px-4">
                        <div className="w-20 bg-gray-200 rounded-full h-2 ml-auto">
                          <div 
                            className="bg-purple-500 h-2 rounded-full" 
                            style={{ width: `${cat.competitionIntensity}%` }}
                          />
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {cat.competitionIntensity ? cat.competitionIntensity.toFixed(0) : '0'}
                        </div>
                      </td>
                      <td className="text-right py-3 px-4 text-sm text-gray-600">
                        {formatNumber(Math.round(cat.averageVotesPerCandidate))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* 黑马艺人 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-yellow-500" />
              黑马艺人 TOP {heatData.darkHorses.length}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {heatData.darkHorses.map((horse, index) => (
                <div key={horse.artistId} className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center space-x-3">
                    {horse.imageUrl && (
                      <img 
                        src={horse.imageUrl} 
                        alt={horse.artistName}
                        className="w-12 h-12 rounded-full object-cover border-2 border-yellow-400"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.style.display = 'none'
                        }}
                      />
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-yellow-500 font-bold">#{index + 1}</span>
                        <span className="font-medium">{horse.artistName}</span>
                      </div>
                      {horse.englishName && (
                        <div className="text-sm text-gray-500">{horse.englishName}</div>
                      )}
                      <div className="text-xs text-gray-500">{horse.categoryName}</div>
                      {horse.nameOfWork && (
                        <div className="text-xs text-blue-600">《{horse.nameOfWork}》</div>
                      )}
                    </div>
                  </div>
                  
                  <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-500">排名变化:</span>
                      <span className="ml-1 text-green-600 font-medium">
                        ↑{horse.rankChange}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">票数增长:</span>
                      <span className="ml-1 text-green-600 font-medium">
                        +{horse.voteGrowth.toFixed(1)}%
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">当前排名:</span>
                      <span className="ml-1 font-medium">#{horse.currentRank}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">当前票数:</span>
                      <span className="ml-1 font-medium">{formatNumber(horse.currentVotes)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 