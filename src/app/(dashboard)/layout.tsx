import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { Sidebar } from '@/components/sidebar'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/auth/signin')
  }

  return (
    <div className="flex h-screen">
      <Sidebar user={session.user} />
      <main className="flex-1 overflow-y-auto bg-gray-50 p-8">{children}</main>
    </div>
  )
}
