'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function NotFound() {
  const router = useRouter()

  useEffect(() => {
    // 在客户端处理路由重定向
    const path = window.location.pathname
    const basePath = process.env.NODE_ENV === 'production' ? '/JMA-Voting' : ''
    
    // 移除 basePath 前缀来获取实际路径
    const actualPath = path.replace(basePath, '') || '/'
    
    // 检查是否是有效的应用路由
    const validRoutes = ['/', '/dashboard', '/trend', '/heat']
    
    if (validRoutes.includes(actualPath)) {
      // 如果是有效路由，直接导航到该路由
      router.replace(actualPath)
    } else if (actualPath.startsWith('/dashboard') || 
               actualPath.startsWith('/trend') || 
               actualPath.startsWith('/heat')) {
      // 如果是子路由，导航到主路由
      const mainRoute = '/' + actualPath.split('/')[1]
      router.replace(mainRoute)
    } else {
      // 其他情况重定向到首页
      router.replace('/')
    }
  }, [router])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
        <p className="text-gray-600">正在加载页面...</p>
      </div>
    </div>
  )
}