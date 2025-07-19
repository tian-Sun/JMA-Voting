'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { BarChart3, TrendingUp, Flame, Activity } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { RunRecords } from '@/components/ui/run-records'

const navigation = [
  {
    name: '榜单概览',
    href: '/dashboard',
    icon: BarChart3,
    description: '各榜单艺人排行',
    color: 'bg-blue-500'
  },
  {
    name: '趋势分析',
    href: '/trend',
    icon: TrendingUp,
    description: '投票趋势与排名变化',
    color: 'bg-green-500'
  },
  {
    name: '榜单热度',
    href: '/heat',
    icon: Flame,
    description: '总票数分析与黑马榜',
    color: 'bg-orange-500'
  }
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 头部 */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
                <BarChart3 className="w-8 h-8 text-white" />
              </div>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              FanFever 数据看板
            </h1>
            <p className="text-xl text-gray-600 mb-6">
              投票数据实时监控与分析平台
            </p>
            <p className="text-sm text-gray-500 max-w-2xl mx-auto">
              实时监控FanFever投票数据，提供榜单概览、趋势分析和热度分析功能，
              帮助了解投票动态和艺人表现趋势。
            </p>
          </div>
        </div>
      </div>

      {/* 主要内容 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* 功能导航卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {navigation.map((item) => {
            const Icon = item.icon
            return (
              <Link key={item.name} href={item.href}>
                <Card className="h-full hover:shadow-lg transition-all duration-200 cursor-pointer group">
                  <CardHeader className="text-center">
                    <div className={`w-12 h-12 ${item.color} rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-200`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <CardTitle className="text-xl">{item.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-center">
                    <p className="text-gray-600">{item.description}</p>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>

        {/* 数据拉取记录 */}
        <div className="mb-8">
          <RunRecords />
        </div>
      </div>
    </div>
  )
} 