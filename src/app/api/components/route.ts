import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { z } from 'zod'

const componentSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  uom: z.string().default('pièce'),
  coutStandard: z.number(),
  packColisage: z.number().optional().nullable(),
})

export async function GET() {
  try {
    const components = await prisma.component.findMany({
      where: { active: true },
      orderBy: { code: 'asc' },
    })
    return NextResponse.json(components)
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
    const data = componentSchema.parse(body)

    const component = await prisma.component.create({
      data,
    })

    return NextResponse.json(component)
  } catch (error: any) {
    console.error('Erreur création composant:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la création du composant' },
      { status: 400 }
    )
  }
}
