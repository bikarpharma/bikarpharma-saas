'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import {
  LayoutDashboard,
  Package,
  Component as ComponentIcon,
  Users,
  FileText,
  ArrowRightLeft,
  ClipboardList,
  BarChart3,
  LogOut,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from './ui/button'

interface SidebarProps {
  user: {
    name?: string | null
    email?: string | null
    role: string
  }
}

const navigation = [
  { name: 'Tableau de bord', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Produits finis', href: '/dashboard/products', icon: Package },
  { name: 'Composants', href: '/dashboard/components', icon: ComponentIcon },
  { name: 'Fournisseurs', href: '/dashboard/suppliers', icon: Users },
  { name: 'Factures', href: '/dashboard/invoices', icon: FileText },
  { name: 'Mouvements', href: '/dashboard/movements', icon: ArrowRightLeft },
  { name: 'Ordres de fabrication', href: '/dashboard/of', icon: ClipboardList },
  { name: 'Rapports', href: '/dashboard/reports', icon: BarChart3 },
]

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()

  return (
    <div className="flex w-64 flex-col border-r bg-white">
      <div className="flex h-16 items-center border-b px-6">
        <h1 className="text-xl font-bold text-primary">Bikarpharma</h1>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {navigation.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <Icon className="h-5 w-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>

      <div className="border-t p-4">
        <div className="mb-3 px-3">
          <p className="text-sm font-medium">{user.name || user.email}</p>
          <p className="text-xs text-muted-foreground">{user.role}</p>
        </div>
        <Button
          variant="outline"
          className="w-full justify-start"
          onClick={() => signOut({ callbackUrl: '/auth/signin' })}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Déconnexion
        </Button>
      </div>
    </div>
  )
}
