import Navigation from '@/components/ui/navigation'

export default function TrendLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <Navigation />
      <main className="flex-1">
        {children}
      </main>
    </>
  )
} 