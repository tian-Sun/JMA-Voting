import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { cn } from '@/lib/utils'
import { TooltipProvider } from '@/components/ui/tooltip'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'FanFever 投票数据看板',
  description: '实时监控投票数据，分析榜单趋势和热度变化',
  keywords: ['投票', '数据看板', '榜单', '趋势分析'],
  authors: [{ name: 'FanFever Team' }],
  viewport: 'width=device-width, initial-scale=1',
  robots: 'index, follow',
  openGraph: {
    title: 'FanFever 投票数据看板',
    description: '实时监控投票数据，分析榜单趋势和热度变化',
    type: 'website',
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className={cn(
        inter.className,
        'min-h-screen bg-background antialiased'
      )}>
        <TooltipProvider delayDuration={300}>
          <div className="relative min-h-screen flex flex-col">
            {children}
          </div>
        </TooltipProvider>
      </body>
    </html>
  )
} 