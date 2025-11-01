import { prisma } from '@/lib/prisma'
import { MovementService } from '@/lib/stock.service'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { z } from 'zod'

const transfertSchema = z.object({
  productId: z.string(),
  qty: z.number().positive(),
  lot: z.string().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !['ADMIN', 'OPERATEUR'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const body = await req.json()
    const data = transfertSchema.parse(body)

    const movement = await MovementService.createMovement({
      type: 'TRANSFERT_FINI_VERS_DEPOT',
      itemType: 'PRODUCT',
      itemId: data.productId,
      lot: data.lot,
      qty: data.qty,
      fromLocationId: 'PIPCOS',
      toLocationId: 'DEPOT',
      createdBy: session.user.email,
    })

    return NextResponse.json(movement)
  } catch (error: any) {
    console.error('Erreur transfert vers dépôt:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la création du mouvement' },
      { status: 400 }
    )
  }
}
