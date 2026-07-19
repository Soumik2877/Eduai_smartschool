import { redirect } from 'next/navigation'
import { resolveViewer } from '@/lib/viewer'
import Sidebar from '@/components/layout/Sidebar'
import TopBar from '@/components/layout/TopBar'
import PreviewBanner from '@/components/layout/PreviewBanner'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const viewer = await resolveViewer()
  if (!viewer) redirect('/auth/login')

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar role={viewer.role} />
      <div className="flex-1 flex flex-col overflow-hidden">
        {viewer.isPreview && (
          <PreviewBanner name={viewer.profile?.full_name ?? 'User'} role={viewer.role} />
        )}
        <TopBar profile={viewer.profile} />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
