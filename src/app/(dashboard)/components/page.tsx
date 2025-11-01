import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import Link from 'next/link'

async function getComponents() {
  const components = await prisma.component.findMany({
    where: { active: true },
    include: {
      costSnapshots: true,
    },
    orderBy: { code: 'asc' },
  })

  const componentsWithStock = await Promise.all(
    components.map(async (component) => {
      const balances = await prisma.stockBalance.findMany({
        where: {
          itemType: 'COMPONENT',
          itemId: component.id,
        },
      })

      const totalStock = balances.reduce((sum, b) => sum + b.qtyOnHand, 0)
      const avgCost = component.costSnapshots[0]?.avgCost || component.coutStandard

      return {
        ...component,
        totalStock,
        avgCost,
      }
    })
  )

  return componentsWithStock
}

export default async function ComponentsPage() {
  const components = await getComponents()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Composants</h1>
          <p className="text-muted-foreground">Gestion des composants et matières premières</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/components/new">
            <Plus className="mr-2 h-4 w-4" />
            Nouveau composant
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des composants</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Nom</TableHead>
                <TableHead>Unité</TableHead>
                <TableHead className="text-right">Stock total</TableHead>
                <TableHead className="text-right">Coût moyen</TableHead>
                <TableHead className="text-right">Coût standard</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {components.map((component) => (
                <TableRow key={component.id}>
                  <TableCell className="font-medium">{component.code}</TableCell>
                  <TableCell>{component.name}</TableCell>
                  <TableCell>{component.uom}</TableCell>
                  <TableCell className="text-right">{component.totalStock}</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(component.avgCost.toString())}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(component.coutStandard.toString())}
                  </TableCell>
                </TableRow>
              ))}
              {components.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    Aucun composant trouvé
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
