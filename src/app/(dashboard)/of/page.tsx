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
import { formatDate } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import Link from 'next/link'

async function getManufacturingOrders() {
  return prisma.manufacturingOrder.findMany({
    include: {
      product: true,
    },
    orderBy: { dateLancement: 'desc' },
  })
}

export default async function OFPage() {
  const orders = await getManufacturingOrders()

  const statusColors = {
    BROUILLON: 'bg-gray-100 text-gray-800',
    EN_COURS: 'bg-blue-100 text-blue-800',
    CLOS: 'bg-green-100 text-green-800',
  }

  const statusLabels = {
    BROUILLON: 'Brouillon',
    EN_COURS: 'En cours',
    CLOS: 'Clôturé',
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Ordres de fabrication</h1>
          <p className="text-muted-foreground">Gestion des OF et suivi de production</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/of/new">
            <Plus className="mr-2 h-4 w-4" />
            Nouvel OF
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des ordres de fabrication</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code OF</TableHead>
                <TableHead>Produit</TableHead>
                <TableHead>Date lancement</TableHead>
                <TableHead className="text-right">Qté commandée</TableHead>
                <TableHead className="text-right">Qté produite</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Lot fini</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((of) => (
                <TableRow key={of.id}>
                  <TableCell className="font-medium">
                    <Link
                      href={`/dashboard/of/${of.id}`}
                      className="text-primary hover:underline"
                    >
                      {of.ofCode}
                    </Link>
                  </TableCell>
                  <TableCell>{of.product.name}</TableCell>
                  <TableCell>{formatDate(of.dateLancement)}</TableCell>
                  <TableCell className="text-right">{of.qtyCommandee}</TableCell>
                  <TableCell className="text-right">{of.qtyProduite}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${statusColors[of.statut]}`}
                    >
                      {statusLabels[of.statut]}
                    </span>
                  </TableCell>
                  <TableCell>{of.lotFini || '-'}</TableCell>
                </TableRow>
              ))}
              {orders.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    Aucun ordre de fabrication trouvé
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
