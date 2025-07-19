'use client'

import { useState, useEffect } from 'react'

export default function DebugPage() {
  const [logs, setLogs] = useState<string[]>([])

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  useEffect(() => {
    async function testDataLoading() {
      try {
        addLog('开始测试数据加载...')
        
        // 测试manifest
        addLog('测试manifest文件...')
        const manifestResponse = await fetch('/data/manifest.json')
        if (!manifestResponse.ok) {
          throw new Error(`Manifest加载失败: ${manifestResponse.status}`)
        }
        const manifest = await manifestResponse.json()
        addLog(`Manifest加载成功: ${JSON.stringify(manifest)}`)
        
        // 测试数据文件
        addLog('测试数据文件...')
        const dataResponse = await fetch('/data/2025-07-19_first.json.gz')
        if (!dataResponse.ok) {
          throw new Error(`数据文件加载失败: ${dataResponse.status}`)
        }
        addLog(`数据文件加载成功，大小: ${dataResponse.headers.get('content-length')} bytes`)
        
        // 测试解压缩
        addLog('测试解压缩...')
        const arrayBuffer = await dataResponse.arrayBuffer()
        const compressed = new Uint8Array(arrayBuffer)
        addLog(`压缩数据大小: ${compressed.length} bytes`)
        
        // 动态导入pako
        addLog('导入pako...')
        const pako = await import('pako')
        addLog('pako导入成功')
        
        // 解压缩
        addLog('开始解压缩...')
        const decompressed = pako.inflate(compressed, { to: 'string' })
        addLog(`解压后数据大小: ${decompressed.length} characters`)
        
        // 解析JSON
        addLog('解析JSON...')
        const data = JSON.parse(decompressed)
        addLog(`JSON解析成功，数据概览: ${data.snapshot_date}, 分类数: ${Object.keys(data.categories).length}`)
        
        addLog('✅ 所有测试通过！')
        
      } catch (error) {
        addLog(`❌ 错误: ${error}`)
        console.error('调试错误:', error)
      }
    }

    testDataLoading()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-2xl font-bold mb-4">数据加载调试</h1>
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">日志:</h2>
          <div className="bg-gray-100 p-4 rounded text-sm font-mono max-h-96 overflow-y-auto">
            {logs.map((log, index) => (
              <div key={index} className="mb-1">{log}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
} 