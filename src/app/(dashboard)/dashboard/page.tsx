import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Package, AlertTriangle, DollarSign, ClipboardList } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

async function getDashboardStats() {
  const [
    ofEnCours,
    productsAtDepot,
    productsAtPipcos,
    components,
    stockBalances,
  ] = await Promise.all([
    prisma.manufacturingOrder.count({ where: { statut: 'EN_COURS' } }),
    prisma.stockBalance.aggregate({
      where: { itemType: 'PRODUCT', locationId: 'DEPOT' },
      _sum: { qtyOnHand: true },
    }),
    prisma.stockBalance.aggregate({
      where: { itemType: 'PRODUCT', locationId: 'PIPCOS' },
      _sum: { qtyOnHand: true },
    }),
    prisma.component.findMany({
      include: {
        costSnapshots: true,
      },
    }),
    prisma.stockBalance.findMany({
      where: { itemType: 'COMPONENT' },
    }),
  ])

  let totalComponentValue = 0
  for (const component of components) {
    const snapshot = component.costSnapshots[0]
    const avgCost = snapshot ? parseFloat(snapshot.avgCost.toString()) : parseFloat(component.coutStandard.toString())
    const balance = stockBalances.find(sb => sb.itemId === component.id)
    const qty = balance?.qtyOnHand || 0
    totalComponentValue += avgCost * qty
  }

  return {
    ofEnCours,
    productsAtDepot: productsAtDepot._sum.qtyOnHand || 0,
    productsAtPipcos: productsAtPipcos._sum.qtyOnHand || 0,
    totalComponentValue,
  }
}

export default async function DashboardPage() {
  const stats = await getDashboardStats()

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Tableau de bord</h1>
        <p className="text-muted-foreground">
          Vue d'ensemble de la gestion de sous-traitance Bikarpharma
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">OF en cours</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.ofEnCours}</div>
            <p className="text-xs text-muted-foreground">Ordres de fabrication actifs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stock PF (DEPOT)</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.productsAtDepot}</div>
            <p className="text-xs text-muted-foreground">Produits finis au dépôt</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stock PF (PIPCOS)</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.productsAtPipcos}</div>
            <p className="text-xs text-muted-foreground">Produits finis chez Pipcos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valeur stock composants</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalComponentValue)}</div>
            <p className="text-xs text-muted-foreground">Valeur totale au coût moyen</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Bienvenue sur Bikarpharma</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Cette application vous permet de gérer les flux de sous-traitance avec le façonnier Pipcos.
            Utilisez le menu à gauche pour accéder aux différentes fonctionnalités.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
