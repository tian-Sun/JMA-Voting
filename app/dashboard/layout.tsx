import Navigation from '@/components/ui/navigation'

export default function DashboardLayout({
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