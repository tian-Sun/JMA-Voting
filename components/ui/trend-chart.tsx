'use client'

import { useState } from 'react'
import { X, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TrendDataPoint {
  date: string
  rank: number
  votes: number
}

interface TrendChartProps {
  data: TrendDataPoint[]
  artistName: string
  className?: string
  showModal?: boolean
  onModalClose?: () => void
}

interface TrendModalProps {
  data: TrendDataPoint[]
  artistName: string
  onClose: () => void
}

// 迷你趋势图组件
export function MiniTrendChart({ data, artistName, className }: TrendChartProps) {
  const [showModal, setShowModal] = useState(false)

  if (!data || data.length === 0) {
    return (
      <div className={cn("flex items-center justify-center w-16 h-8 bg-gray-100 rounded text-gray-400 text-xs", className)}>
        <Minus className="w-3 h-3" />
      </div>
    )
  }

  // 如果只有一天数据，显示单点提示
  if (data.length === 1) {
    return (
      <div className={cn("flex items-center justify-center w-16 h-8 bg-blue-50 rounded border border-blue-200 text-blue-600 text-xs", className)}>
        <span className="text-xs">单日</span>
      </div>
    )
  }

  // 计算趋势图数据
  const maxRank = Math.max(...data.map(d => d.rank))
  const minRank = Math.min(...data.map(d => d.rank))
  const rankRange = maxRank - minRank || 1

  // 生成SVG路径
  const points = data.map((point, index) => {
    const x = (index / (data.length - 1)) * 60 // 60px宽度
    const y = ((point.rank - minRank) / rankRange) * 24 // 24px高度，反转Y轴
    return `${x},${y}`
  }).join(' ')

  // 计算趋势方向
  const firstRank = data[0]?.rank || 0
  const lastRank = data[data.length - 1]?.rank || 0
  const trendDirection = firstRank > lastRank ? 'up' : firstRank < lastRank ? 'down' : 'stable'

  return (
    <>
      <div 
        className={cn(
          "relative cursor-pointer group",
          "w-16 h-8 bg-gray-50 rounded border border-gray-200",
          "hover:border-blue-300 hover:bg-blue-50 transition-colors",
          className
        )}
        onClick={() => setShowModal(true)}
        title={`点击查看 ${artistName} 的详细趋势`}
      >
        <svg className="w-full h-full p-1" viewBox="0 0 60 24">
          <polyline
            points={points}
            fill="none"
            stroke={trendDirection === 'up' ? '#10b981' : trendDirection === 'down' ? '#ef4444' : '#6b7280'}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* 数据点 */}
          {data.map((point, index) => {
            const x = (index / (data.length - 1)) * 60
            const y = ((point.rank - minRank) / rankRange) * 24
            return (
              <circle
                key={index}
                cx={x}
                cy={y}
                r="1.5"
                fill={trendDirection === 'up' ? '#10b981' : trendDirection === 'down' ? '#ef4444' : '#6b7280'}
              />
            )
          })}
        </svg>
        
        {/* 趋势指示器 */}
        <div className="absolute -top-1 -right-1">
          {trendDirection === 'up' && (
            <TrendingUp className="w-3 h-3 text-green-600" />
          )}
          {trendDirection === 'down' && (
            <TrendingDown className="w-3 h-3 text-red-600" />
          )}
          {trendDirection === 'stable' && (
            <Minus className="w-3 h-3 text-gray-500" />
          )}
        </div>
      </div>

      {/* 模态框 */}
      {showModal && (
        <TrendModal
          data={data}
          artistName={artistName}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  )
}

// 大图模态框组件
function TrendModal({ data, artistName, onClose }: TrendModalProps) {
  if (!data || data.length === 0) return null

  const maxRank = Math.max(...data.map(d => d.rank))
  const minRank = Math.min(...data.map(d => d.rank))
  const rankRange = maxRank - minRank || 1
  const maxVotes = Math.max(...data.map(d => d.votes))

  // 生成排名趋势SVG路径
  const rankPoints = data.map((point, index) => {
    const x = (index / (data.length - 1)) * 400
    const y = ((point.rank - minRank) / rankRange) * 200
    return `${x},${y}`
  }).join(' ')

  // 生成票数趋势SVG路径
  const votePoints = data.map((point, index) => {
    const x = (index / (data.length - 1)) * 400
    const y = 200 - ((point.votes / maxVotes) * 200)
    return `${x},${y}`
  }).join(' ')

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {artistName} - 趋势分析
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 排名趋势图 */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-4 text-gray-800">排名变化趋势</h3>
              <div className="relative h-64">
                <svg className="w-full h-full" viewBox="0 0 400 200">
                  {/* 网格线 */}
                  {Array.from({ length: 5 }, (_, i) => (
                    <line
                      key={i}
                      x1="0"
                      y1={i * 40}
                      x2="400"
                      y2={i * 40}
                      stroke="#e5e7eb"
                      strokeWidth="1"
                    />
                  ))}
                  
                  {/* 排名趋势线 */}
                  <polyline
                    points={rankPoints}
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  
                  {/* 数据点 */}
                  {data.map((point, index) => {
                    const x = (index / (data.length - 1)) * 400
                    const y = ((point.rank - minRank) / rankRange) * 200
                    return (
                      <g key={index}>
                        <circle
                          cx={x}
                          cy={y}
                          r="4"
                          fill="#3b82f6"
                        />
                        <text
                          x={x}
                          y={y - 10}
                          textAnchor="middle"
                          className="text-xs fill-gray-600"
                        >
                          #{point.rank}
                        </text>
                      </g>
                    )
                  })}
                </svg>
                
                {/* Y轴标签 */}
                <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-500">
                  <span>#{maxRank}</span>
                  <span>#{Math.round((maxRank + minRank) / 2)}</span>
                  <span>#{minRank}</span>
                </div>
              </div>
            </div>

            {/* 票数趋势图 */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-4 text-gray-800">票数变化趋势</h3>
              <div className="relative h-64">
                <svg className="w-full h-full" viewBox="0 0 400 200">
                  {/* 网格线 */}
                  {Array.from({ length: 5 }, (_, i) => (
                    <line
                      key={i}
                      x1="0"
                      y1={i * 40}
                      x2="400"
                      y2={i * 40}
                      stroke="#e5e7eb"
                      strokeWidth="1"
                    />
                  ))}
                  
                  {/* 票数趋势线 */}
                  <polyline
                    points={votePoints}
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  
                  {/* 数据点 */}
                  {data.map((point, index) => {
                    const x = (index / (data.length - 1)) * 400
                    const y = 200 - ((point.votes / maxVotes) * 200)
                    return (
                      <g key={index}>
                        <circle
                          cx={x}
                          cy={y}
                          r="4"
                          fill="#10b981"
                        />
                        <text
                          x={x}
                          y={y - 10}
                          textAnchor="middle"
                          className="text-xs fill-gray-600"
                        >
                          {point.votes.toLocaleString()}
                        </text>
                      </g>
                    )
                  })}
                </svg>
                
                {/* Y轴标签 */}
                <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-500">
                  <span>{maxVotes.toLocaleString()}</span>
                  <span>{(maxVotes / 2).toLocaleString()}</span>
                  <span>0</span>
                </div>
              </div>
            </div>
          </div>

          {/* 数据表格 */}
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">详细数据</h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-200">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-200 px-4 py-2 text-left">日期</th>
                    <th className="border border-gray-200 px-4 py-2 text-center">排名</th>
                    <th className="border border-gray-200 px-4 py-2 text-center">票数</th>
                    <th className="border border-gray-200 px-4 py-2 text-center">排名变化</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((point, index) => {
                    const prevRank = index > 0 ? data[index - 1].rank : point.rank
                    const rankChange = prevRank - point.rank
                    return (
                      <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="border border-gray-200 px-4 py-2">
                          {new Date(point.date).toLocaleDateString('zh-CN')}
                        </td>
                        <td className="border border-gray-200 px-4 py-2 text-center font-medium">
                          #{point.rank}
                        </td>
                        <td className="border border-gray-200 px-4 py-2 text-center">
                          {point.votes.toLocaleString()}
                        </td>
                        <td className="border border-gray-200 px-4 py-2 text-center">
                          {index === 0 ? (
                            <span className="text-gray-500">-</span>
                          ) : rankChange > 0 ? (
                            <span className="text-green-600">↑{rankChange}</span>
                          ) : rankChange < 0 ? (
                            <span className="text-red-600">↓{Math.abs(rankChange)}</span>
                          ) : (
                            <span className="text-gray-500">—</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 