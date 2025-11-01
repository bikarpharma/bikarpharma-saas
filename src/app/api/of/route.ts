import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { z } from 'zod'

const ofSchema = z.object({
  ofCode: z.string().min(1),
  productId: z.string().min(1),
  qtyCommandee: z.number().positive(),
  dateLancement: z.date().or(z.string()),
})

export async function GET() {
  try {
    const orders = await prisma.manufacturingOrder.findMany({
      include: {
        product: true,
      },
      orderBy: { dateLancement: 'desc' },
    })
    return NextResponse.json(orders)
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
    const data = ofSchema.parse(body)

    const of = await prisma.manufacturingOrder.create({
      data: {
        ...data,
        dateLancement: new Date(data.dateLancement),
      },
    })

    return NextResponse.json(of)
  } catch (error: any) {
    console.error('Erreur création OF:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la création de l\'OF' },
      { status: 400 }
    )
  }
}
