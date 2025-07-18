'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './card'
import { Badge } from './badge'
import { Clock, CheckCircle, XCircle, Calendar, Activity } from 'lucide-react'

interface RunRecord {
  date: string
  time: string
  timestamp: number
  success: boolean
  error?: string
}

interface RunRecords {
  [stage: string]: RunRecord[]
}

export function RunRecords() {
  const [records, setRecords] = useState<RunRecords>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchRunRecords() {
      try {
        setLoading(true)
        const response = await fetch('/data/run-records.json')
        
        if (!response.ok) {
          throw new Error('无法加载运行记录')
        }
        
        const data = await response.json()
        setRecords(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : '加载失败')
      } finally {
        setLoading(false)
      }
    }

    fetchRunRecords()
  }, [])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            数据拉取记录
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            数据拉取记录
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8 text-red-500">
            <XCircle className="h-5 w-5 mr-2" />
            {error}
          </div>
        </CardContent>
      </Card>
    )
  }

  const stages = Object.keys(records)
  if (stages.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            数据拉取记录
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            暂无运行记录
          </div>
        </CardContent>
      </Card>
    )
  }

  function formatTime(timeString: string) {
    const date = new Date(timeString)
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString)
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  }

  function getStageDisplayName(stage: string) {
    const stageNames: { [key: string]: string } = {
      'first': '第一阶段',
      'second': '第二阶段'
    }
    return stageNames[stage] || stage
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          数据拉取记录
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {stages.map(stage => {
            const stageRecords = records[stage]
            const todayRecords = stageRecords.filter(record => {
              const today = new Date().toISOString().split('T')[0]
              return record.date === today
            })
            
            return (
              <div key={stage} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-lg">
                    {getStageDisplayName(stage)}
                  </h3>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      今日: {todayRecords.length} 次
                    </Badge>
                    <Badge variant="outline">
                      总计: {stageRecords.length} 次
                    </Badge>
                  </div>
                </div>
                
                <div className="space-y-2">
                  {stageRecords.slice(0, 5).map((record, index) => (
                    <div
                      key={record.timestamp}
                      className={`flex items-center justify-between p-3 rounded-lg border ${
                        record.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {record.success ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-500" />
                        )}
                        
                        <div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-500" />
                            <span className="font-medium">
                              {formatDate(record.date)}
                            </span>
                            <Clock className="h-4 w-4 text-gray-500" />
                            <span className="text-sm text-gray-600">
                              {formatTime(record.time)}
                            </span>
                          </div>
                          
                          {!record.success && record.error && (
                            <div className="text-sm text-red-600 mt-1">
                              错误: {record.error}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <Badge variant={record.success ? "default" : "destructive"}>
                        {record.success ? '成功' : '失败'}
                      </Badge>
                    </div>
                  ))}
                  
                  {stageRecords.length > 5 && (
                    <div className="text-center text-sm text-gray-500 py-2">
                      还有 {stageRecords.length - 5} 条记录...
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
} 