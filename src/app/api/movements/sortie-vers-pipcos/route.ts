import { prisma } from '@/lib/prisma'
import { MovementService } from '@/lib/stock.service'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { z } from 'zod'

const sortieVersPipcosSchema = z.object({
  ofId: z.string(),
  componentId: z.string(),
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
    const data = sortieVersPipcosSchema.parse(body)

    const movement = await MovementService.createMovement({
      type: 'SORTIE_VERS_PIPCOS',
      ofId: data.ofId,
      itemType: 'COMPONENT',
      itemId: data.componentId,
      lot: data.lot,
      qty: data.qty,
      fromLocationId: 'DEPOT',
      toLocationId: 'PIPCOS',
      createdBy: session.user.email,
    })

    return NextResponse.json(movement)
  } catch (error: any) {
    console.error('Erreur sortie vers Pipcos:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la création du mouvement' },
      { status: 400 }
    )
  }
}
