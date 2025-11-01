import { prisma } from '@/lib/prisma'
import { MovementService } from '@/lib/stock.service'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { z } from 'zod'

const productionFiniSchema = z.object({
  ofId: z.string(),
  productId: z.string(),
  qty: z.number().positive(),
  lotFini: z.string(),
})

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !['ADMIN', 'OPERATEUR'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const body = await req.json()
    const data = productionFiniSchema.parse(body)

    // Vérifier que l'OF existe et correspond au produit
    const of = await prisma.manufacturingOrder.findUnique({
      where: { id: data.ofId },
    })

    if (!of || of.productId !== data.productId) {
      return NextResponse.json(
        { error: 'OF invalide ou produit non correspondant' },
        { status: 400 }
      )
    }

    // Créer le mouvement de production
    const movement = await MovementService.createMovement({
      type: 'PRODUCTION_FINI',
      ofId: data.ofId,
      itemType: 'PRODUCT',
      itemId: data.productId,
      lot: data.lotFini,
      qty: data.qty,
      toLocationId: 'PIPCOS',
      createdBy: session.user.email,
    })

    // Mettre à jour la quantité produite de l'OF
    await prisma.manufacturingOrder.update({
      where: { id: data.ofId },
      data: {
        qtyProduite: { increment: data.qty },
        lotFini: data.lotFini,
      },
    })

    return NextResponse.json(movement)
  } catch (error: any) {
    console.error('Erreur production fini:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la création du mouvement' },
      { status: 400 }
    )
  }
}
