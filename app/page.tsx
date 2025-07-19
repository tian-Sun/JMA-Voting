import { redirect } from 'next/navigation'
 
export default function HomePage() {
  // 重定向到榜单概览页面
  redirect('/dashboard')
} 