import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { z } from 'zod'

const productSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  uom: z.string().default('pièce'),
  coutSousTraitanceUnite: z.number(),
  coutAutresUnite: z.number().default(0),
})

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      where: { active: true },
      orderBy: { code: 'asc' },
    })
    return NextResponse.json(products)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !['ADMIN', 'OPERATEUR'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const body = await req.json()
    const data = productSchema.parse(body)

    const product = await prisma.product.create({
      data,
    })

    return NextResponse.json(product)
  } catch (error: any) {
    console.error('Erreur création produit:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la création du produit' },
      { status: 400 }
    )
  }
}
