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

async function getStockReport() {
  const components = await prisma.component.findMany({
    where: { active: true },
    include: {
      costSnapshots: true,
    },
  })

  const products = await prisma.product.findMany({
    where: { active: true },
  })

  const stockBalances = await prisma.stockBalance.findMany()

  const componentData = components.map((component) => {
    const balances = stockBalances.filter(
      (b) => b.itemType === 'COMPONENT' && b.itemId === component.id
    )
    const totalQty = balances.reduce((sum, b) => sum + b.qtyOnHand, 0)
    const avgCost = component.costSnapshots[0]?.avgCost || component.coutStandard
    const value = totalQty * parseFloat(avgCost.toString())

    return {
      code: component.code,
      name: component.name,
      qty: totalQty,
      avgCost: parseFloat(avgCost.toString()),
      value,
    }
  })

  const productData = products.map((product) => {
    const balances = stockBalances.filter(
      (b) => b.itemType === 'PRODUCT' && b.itemId === product.id
    )
    const totalQty = balances.reduce((sum, b) => sum + b.qtyOnHand, 0)

    return {
      code: product.code,
      name: product.name,
      qty: totalQty,
    }
  })

  const totalComponentValue = componentData.reduce((sum, c) => sum + c.value, 0)

  return { componentData, productData, totalComponentValue }
}

export default async function ReportsPage() {
  const { componentData, productData, totalComponentValue } = await getStockReport()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Rapports</h1>
        <p className="text-muted-foreground">Rapports de stock et analyse</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Stock des composants</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Nom</TableHead>
                <TableHead className="text-right">Quantité</TableHead>
                <TableHead className="text-right">Coût moyen</TableHead>
                <TableHead className="text-right">Valeur totale</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {componentData.map((component) => (
                <TableRow key={component.code}>
                  <TableCell className="font-medium">{component.code}</TableCell>
                  <TableCell>{component.name}</TableCell>
                  <TableCell className="text-right">{component.qty}</TableCell>
                  <TableCell className="text-right">{formatCurrency(component.avgCost)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(component.value)}</TableCell>
                </TableRow>
              ))}
              <TableRow className="font-bold">
                <TableCell colSpan={4} className="text-right">
                  Total
                </TableCell>
                <TableCell className="text-right">{formatCurrency(totalComponentValue)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Stock des produits finis</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Nom</TableHead>
                <TableHead className="text-right">Quantité</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {productData.map((product) => (
                <TableRow key={product.code}>
                  <TableCell className="font-medium">{product.code}</TableCell>
                  <TableCell>{product.name}</TableCell>
                  <TableCell className="text-right">{product.qty}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
