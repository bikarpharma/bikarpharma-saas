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
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import Link from 'next/link'

async function getSuppliers() {
  return prisma.supplier.findMany({
    include: {
      _count: {
        select: { invoices: true },
      },
    },
    orderBy: { name: 'asc' },
  })
}

export default async function SuppliersPage() {
  const suppliers = await getSuppliers()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Fournisseurs</h1>
          <p className="text-muted-foreground">Gestion des fournisseurs</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/suppliers/new">
            <Plus className="mr-2 h-4 w-4" />
            Nouveau fournisseur
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des fournisseurs</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Téléphone</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="text-right">Factures</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {suppliers.map((supplier) => (
                <TableRow key={supplier.id}>
                  <TableCell className="font-medium">{supplier.name}</TableCell>
                  <TableCell>{supplier.contact || '-'}</TableCell>
                  <TableCell>{supplier.phone || '-'}</TableCell>
                  <TableCell>{supplier.email || '-'}</TableCell>
                  <TableCell className="text-right">{supplier._count.invoices}</TableCell>
                </TableRow>
              ))}
              {suppliers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    Aucun fournisseur trouvé
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
