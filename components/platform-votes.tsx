"use client"

import { PlatformVotes } from '@/types'
import { Badge } from '@/components/ui/badge'
import { useState, useEffect, useRef } from 'react'

interface PlatformVotesProps {
  platformVotes: PlatformVotes[]
  totalVotes: number
  className?: string
}

// 平台名称映射
const PLATFORM_NAMES: { [key: string]: string } = {
  'my1pick': 'My1Pick',
  'mubeat': 'Mubeat',
  'muniverse': 'Muniverse',
  'fancast': 'FanCast',
}

// 平台颜色映射
const PLATFORM_COLORS: { [key: string]: string } = {
  'my1pick': 'bg-blue-100 text-blue-800 border-blue-200',
  'mubeat': 'bg-purple-100 text-purple-800 border-purple-200',
  'muniverse': 'bg-green-100 text-green-800 border-green-200',
  'fancast': 'bg-orange-100 text-orange-800 border-orange-200',
}

export function PlatformVotesDisplay({ platformVotes, totalVotes, className = '' }: PlatformVotesProps) {
  if (!platformVotes || platformVotes.length === 0) {
    return null
  }

  // 按票数排序
  const sortedPlatforms = [...platformVotes].sort((a, b) => b.votes - a.votes)

  return (
    <div className={`flex flex-wrap gap-1 ${className}`}>
      {sortedPlatforms.map((platform, index) => {
        const percentage = totalVotes > 0 ? ((platform.votes / totalVotes) * 100).toFixed(1) : '0'
        const platformName = PLATFORM_NAMES[platform.platform] || platform.platform
        const platformColor = PLATFORM_COLORS[platform.platform] || 'bg-gray-100 text-gray-800 border-gray-200'
        
        return (
          <Badge 
            key={platform.platform}
            variant="outline" 
            className={`text-xs px-2 py-1 ${platformColor} cursor-default`}
          >
            {platformName} {percentage}%
          </Badge>
        )
      })}
    </div>
  )
}

// 简化的平台票数显示（只显示主要平台，点击显示详情）
export function PlatformVotesSummary({ platformVotes, totalVotes, className = '' }: PlatformVotesProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  
  if (!platformVotes || platformVotes.length === 0) {
    return null
  }

  // 处理点击外部关闭
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // 按票数排序
  const sortedPlatforms = [...platformVotes].sort((a, b) => b.votes - a.votes)
  
  // 只显示票数最多的平台
  const topPlatform = sortedPlatforms[0]
  const percentage = totalVotes > 0 ? ((topPlatform.votes / totalVotes) * 100).toFixed(1) : '0'
  const platformName = PLATFORM_NAMES[topPlatform.platform] || topPlatform.platform
  const platformColor = PLATFORM_COLORS[topPlatform.platform] || 'bg-gray-100 text-gray-800 border-gray-200'

  return (
    <div className="relative" ref={containerRef}>
      <Badge 
        variant="outline" 
        className={`text-xs px-2 py-1 ${platformColor} cursor-pointer hover:opacity-80 transition-opacity ${className}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        {platformName} {percentage}%
      </Badge>
      
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 z-[9999] bg-white border border-gray-200 rounded-md shadow-lg p-3 min-w-[200px]">
          <div className="relative">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-xs transition-colors"
            >
              ×
            </button>
            <div className="text-center">
              <div className="font-medium mb-2 text-sm">票数来源分布</div>
              <div className="space-y-1">
                {sortedPlatforms.map((platform, index) => {
                  const platformPercentage = totalVotes > 0 ? ((platform.votes / totalVotes) * 100).toFixed(1) : '0'
                  const platformDisplayName = PLATFORM_NAMES[platform.platform] || platform.platform
                  return (
                    <div key={platform.platform} className="flex justify-between items-center text-xs">
                      <span className="text-gray-700">{platformDisplayName}:</span>
                      <span className="text-gray-900 font-medium">
                        {platform.votes.toLocaleString()} 票 ({platformPercentage}%)
                      </span>
                    </div>
                  )
                })}
              </div>
              <div className="text-xs text-gray-500 mt-2 pt-2 border-t border-gray-200">
                总票数: {totalVotes.toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 