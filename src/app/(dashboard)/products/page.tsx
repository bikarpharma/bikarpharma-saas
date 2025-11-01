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

async function getProducts() {
  return prisma.product.findMany({
    where: { active: true },
    include: {
      bomItems: {
        include: {
          component: true,
        },
      },
    },
    orderBy: { code: 'asc' },
  })
}

export default async function ProductsPage() {
  const products = await getProducts()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Produits finis</h1>
          <p className="text-muted-foreground">Gestion des produits finis et nomenclatures</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/products/new">
            <Plus className="mr-2 h-4 w-4" />
            Nouveau produit
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des produits</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Nom</TableHead>
                <TableHead>Unité</TableHead>
                <TableHead className="text-right">Coût sous-traitance</TableHead>
                <TableHead className="text-right">Coût autres</TableHead>
                <TableHead className="text-right">Composants BOM</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.code}</TableCell>
                  <TableCell>{product.name}</TableCell>
                  <TableCell>{product.uom}</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(product.coutSousTraitanceUnite.toString())}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(product.coutAutresUnite.toString())}
                  </TableCell>
                  <TableCell className="text-right">{product.bomItems.length}</TableCell>
                </TableRow>
              ))}
              {products.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    Aucun produit trouvé
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
