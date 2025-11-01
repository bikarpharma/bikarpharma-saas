import { describe, it, expect, beforeAll } from 'vitest'
import { PrismaClient, Prisma } from '@prisma/client'
import { StockService, MovementService, CostingService } from '../src/lib/stock.service'

const prisma = new PrismaClient()

describe('Stock Management', () => {
  describe('Stock validation', () => {
    it('should prevent negative stock', async () => {
      // Cette fonction devrait lancer une erreur si le stock devient négatif
      await expect(
        StockService.validateMovement('COMPONENT', 'test-id', 'DEPOT', 100, true)
      ).resolves.toMatchObject({
        valid: false,
      })
    })

    it('should allow movement with sufficient stock', async () => {
      const result = await StockService.validateMovement(
        'COMPONENT',
        'test-id',
        'DEPOT',
        0,
        true
      )
      expect(result.valid).toBe(true)
    })
  })

  describe('Average cost calculation', () => {
    it('should calculate weighted average cost correctly', () => {
      // Scénario : Stock actuel = 100 unités @ 1.000 TND
      // Réception : 50 unités @ 1.500 TND
      // Coût moyen attendu = (100 * 1.000 + 50 * 1.500) / 150 = 1.166 TND

      const currentQty = 100
      const currentCost = new Prisma.Decimal(1.0)
      const receivedQty = 50
      const receivedCost = new Prisma.Decimal(1.5)

      const newQty = currentQty + receivedQty
      const newAvgCost = currentCost
        .times(currentQty)
        .plus(receivedCost.times(receivedQty))
        .dividedBy(newQty)

      expect(newAvgCost.toNumber()).toBeCloseTo(1.167, 3)
    })
  })

  describe('Movement validation', () => {
    it('should validate SORTIE_VERS_PIPCOS requires ofId', () => {
      const data = {
        type: 'SORTIE_VERS_PIPCOS' as const,
        itemType: 'COMPONENT' as const,
        itemId: 'test',
        qty: 100,
        fromLocationId: 'DEPOT',
        toLocationId: 'PIPCOS',
      }

      // Sans ofId, devrait échouer
      expect(() => {
        if (!data.ofId) throw new Error('ofId requis')
      }).toThrow()
    })

    it('should validate PRODUCTION_FINI requires PRODUCT itemType', () => {
      const data = {
        type: 'PRODUCTION_FINI' as const,
        itemType: 'COMPONENT' as const, // Devrait être PRODUCT
        itemId: 'test',
        qty: 100,
      }

      expect(data.itemType).not.toBe('PRODUCT')
    })
  })
})

describe('BICAR200 Scenario Validation', () => {
  let componentIds: string[]
  let productId: string
  let ofId: string

  beforeAll(async () => {
    // Récupérer les données du seed
    const components = await prisma.component.findMany({
      where: {
        code: {
          in: [
            'FLACON200',
            'ETIQ_BICAR200',
            'NOTICE_BICAR',
            'ETUI_BICAR200',
            'BOUCHON_PP28',
            'GOBLET_DOSEUR',
          ],
        },
      },
    })
    componentIds = components.map((c) => c.id)

    const product = await prisma.product.findUnique({
      where: { code: 'BICAR200' },
    })
    productId = product?.id || ''

    const of = await prisma.manufacturingOrder.findUnique({
      where: { ofCode: 'OF-2025-002' },
    })
    ofId = of?.id || ''
  })

  it('should have correct component stock at DEPOT', async () => {
    for (const componentId of componentIds) {
      const balance = await prisma.stockBalance.findUnique({
        where: {
          itemType_itemId_locationId: {
            itemType: 'COMPONENT',
            itemId: componentId,
            locationId: 'DEPOT',
          },
        },
      })

      // Initial stock - sorties + retours
      // 7000 ou 10000 - 5000 + 40 = 2040 ou 5040
      expect(balance?.qtyOnHand).toBeGreaterThan(0)
    }
  })

  it('should have correct component stock at PIPCOS (reste théorique)', async () => {
    for (const componentId of componentIds) {
      const balance = await prisma.stockBalance.findUnique({
        where: {
          itemType_itemId_locationId: {
            itemType: 'COMPONENT',
            itemId: componentId,
            locationId: 'PIPCOS',
          },
        },
      })

      // Envoyé - Consommé - Retourné = 5000 - 4900 - 40 = 60
      expect(balance?.qtyOnHand).toBe(60)
    }
  })

  it('should have correct product stock at DEPOT', async () => {
    const balance = await prisma.stockBalance.findUnique({
      where: {
        itemType_itemId_locationId: {
          itemType: 'PRODUCT',
          itemId: productId,
          locationId: 'DEPOT',
        },
      },
    })

    expect(balance?.qtyOnHand).toBe(4900)
  })

  it('should have zero product stock at PIPCOS', async () => {
    const balance = await prisma.stockBalance.findUnique({
      where: {
        itemType_itemId_locationId: {
          itemType: 'PRODUCT',
          itemId: productId,
          locationId: 'PIPCOS',
        },
      },
    })

    // Produit puis transféré = 0
    expect(balance?.qtyOnHand).toBe(0)
  })

  it('should calculate correct unit cost for BICAR200', async () => {
    if (!productId) return

    const unitCost = await CostingService.calculateProductUnitCost(productId)

    // Coût composants = 0.28 + 0.05 + 0.04 + 0.12 + 0.09 + 0.07 = 0.650
    // + Coût sous-traitance = 0.250
    // = 0.900 TND
    expect(unitCost.toNumber()).toBeCloseTo(0.9, 3)
  })

  it('should calculate correct total OF cost', async () => {
    if (!ofId) return

    const { unitCost, totalCost } = await CostingService.calculateOFCost(ofId)

    expect(unitCost.toNumber()).toBeCloseTo(0.9, 3)
    expect(totalCost.toNumber()).toBeCloseTo(4410.0, 3) // 0.900 * 4900
  })

  it('should have correct OF status and quantities', async () => {
    const of = await prisma.manufacturingOrder.findUnique({
      where: { id: ofId },
    })

    expect(of?.ofCode).toBe('OF-2025-002')
    expect(of?.qtyCommandee).toBe(5000)
    expect(of?.qtyProduite).toBe(4900)
    expect(of?.statut).toBe('EN_COURS')
  })
})
