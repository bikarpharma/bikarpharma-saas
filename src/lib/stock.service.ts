import { Prisma, ItemType, MovementType } from '@prisma/client'
import { prisma } from './prisma'

/**
 * Service de gestion des stocks avec validation stricte
 */
export class StockService {
  /**
   * Vérifie si un mouvement créerait un stock négatif
   */
  static async validateMovement(
    itemType: ItemType,
    itemId: string,
    locationId: string,
    qty: number,
    isOutbound: boolean
  ): Promise<{ valid: boolean; currentStock: number; error?: string }> {
    const balance = await prisma.stockBalance.findUnique({
      where: {
        itemType_itemId_locationId: {
          itemType,
          itemId,
          locationId,
        },
      },
    })

    const currentStock = balance?.qtyOnHand || 0

    if (isOutbound && currentStock < qty) {
      return {
        valid: false,
        currentStock,
        error: `Stock insuffisant. Disponible: ${currentStock}, Demandé: ${qty}`,
      }
    }

    return { valid: true, currentStock }
  }

  /**
   * Met à jour le solde de stock après un mouvement
   */
  static async updateStockBalance(
    itemType: ItemType,
    itemId: string,
    locationId: string,
    qtyDelta: number
  ) {
    await prisma.stockBalance.upsert({
      where: {
        itemType_itemId_locationId: {
          itemType,
          itemId,
          locationId,
        },
      },
      create: {
        itemType,
        itemId,
        locationId,
        qtyOnHand: qtyDelta,
      },
      update: {
        qtyOnHand: {
          increment: qtyDelta,
        },
      },
    })
  }

  /**
   * Calcule le coût moyen pondéré d'un composant
   */
  static async recalculateAvgCost(componentId: string, qty: number, unitCost: Decimal.Value) {
    const balance = await prisma.stockBalance.findUnique({
      where: {
        itemType_itemId_locationId: {
          itemType: 'COMPONENT',
          itemId: componentId,
          locationId: 'DEPOT',
        },
      },
    })

    const snapshot = await prisma.costComponentSnapshot.findUnique({
      where: { componentId },
    })

    const currentQty = balance?.qtyOnHand || 0
    const currentAvgCost = snapshot ? new Prisma.Decimal(snapshot.avgCost.toString()) : new Prisma.Decimal(0)
    const newUnitCost = new Prisma.Decimal(unitCost.toString())

    const newQty = currentQty + qty
    const newAvgCost =
      newQty > 0
        ? currentAvgCost.times(currentQty).plus(newUnitCost.times(qty)).dividedBy(newQty)
        : new Prisma.Decimal(0)

    await prisma.costComponentSnapshot.upsert({
      where: { componentId },
      create: {
        componentId,
        avgCost: newAvgCost,
      },
      update: {
        avgCost: newAvgCost,
        computedAt: new Date(),
      },
    })

    return newAvgCost
  }

  /**
   * Obtient le stock actuel par emplacement
   */
  static async getStockByLocation(itemType: ItemType, itemId: string, locationId: string) {
    const balance = await prisma.stockBalance.findUnique({
      where: {
        itemType_itemId_locationId: {
          itemType,
          itemId,
          locationId,
        },
      },
    })

    return balance?.qtyOnHand || 0
  }

  /**
   * Obtient tous les stocks d'un item
   */
  static async getAllStocks(itemType: ItemType, itemId: string) {
    return prisma.stockBalance.findMany({
      where: {
        itemType,
        itemId,
      },
      include: {
        location: true,
      },
    })
  }
}

/**
 * Service de gestion des mouvements
 */
export class MovementService {
  /**
   * Crée un mouvement avec validation et mise à jour des stocks
   */
  static async createMovement(data: {
    type: MovementType
    reference?: string
    ofId?: string
    itemType: ItemType
    itemId: string
    lot?: string
    qty: number
    fromLocationId?: string
    toLocationId?: string
    createdBy?: string
  }) {
    // Validation selon le type de mouvement
    const validation = this.validateMovementData(data)
    if (!validation.valid) {
      throw new Error(validation.error)
    }

    // Vérifier stock si sortie
    if (data.fromLocationId) {
      const stockCheck = await StockService.validateMovement(
        data.itemType,
        data.itemId,
        data.fromLocationId,
        data.qty,
        true
      )
      if (!stockCheck.valid) {
        throw new Error(stockCheck.error)
      }
    }

    // Transaction pour créer le mouvement et mettre à jour les stocks
    return prisma.$transaction(async (tx) => {
      const movement = await tx.movement.create({
        data,
      })

      // Décrémenter stock source
      if (data.fromLocationId) {
        await StockService.updateStockBalance(
          data.itemType,
          data.itemId,
          data.fromLocationId,
          -data.qty
        )
      }

      // Incrémenter stock destination
      if (data.toLocationId) {
        await StockService.updateStockBalance(
          data.itemType,
          data.itemId,
          data.toLocationId,
          data.qty
        )
      }

      return movement
    })
  }

  /**
   * Valide les données d'un mouvement selon son type
   */
  private static validateMovementData(data: {
    type: MovementType
    ofId?: string
    itemType: ItemType
    fromLocationId?: string
    toLocationId?: string
  }): { valid: boolean; error?: string } {
    switch (data.type) {
      case 'ENTREE_DEPOT':
        if (!data.toLocationId || data.fromLocationId) {
          return { valid: false, error: 'ENTREE_DEPOT: toLocation requis, fromLocation doit être null' }
        }
        break
      case 'SORTIE_VERS_PIPCOS':
        if (!data.ofId || !data.fromLocationId || !data.toLocationId) {
          return { valid: false, error: 'SORTIE_VERS_PIPCOS: ofId, fromLocation et toLocation requis' }
        }
        if (data.itemType !== 'COMPONENT') {
          return { valid: false, error: 'SORTIE_VERS_PIPCOS: itemType doit être COMPONENT' }
        }
        break
      case 'PRODUCTION_FINI':
        if (!data.ofId || !data.toLocationId) {
          return { valid: false, error: 'PRODUCTION_FINI: ofId et toLocation requis' }
        }
        if (data.itemType !== 'PRODUCT') {
          return { valid: false, error: 'PRODUCTION_FINI: itemType doit être PRODUCT' }
        }
        break
      case 'TRANSFERT_FINI_VERS_DEPOT':
        if (!data.fromLocationId || !data.toLocationId) {
          return { valid: false, error: 'TRANSFERT_FINI_VERS_DEPOT: fromLocation et toLocation requis' }
        }
        if (data.itemType !== 'PRODUCT') {
          return { valid: false, error: 'TRANSFERT_FINI_VERS_DEPOT: itemType doit être PRODUCT' }
        }
        break
      case 'RETOUR_DE_PIPCOS':
        if (!data.ofId || !data.fromLocationId || !data.toLocationId) {
          return { valid: false, error: 'RETOUR_DE_PIPCOS: ofId, fromLocation et toLocation requis' }
        }
        break
    }

    return { valid: true }
  }
}

/**
 * Service de calcul des coûts
 */
export class CostingService {
  /**
   * Calcule le coût unitaire d'un produit fini
   */
  static async calculateProductUnitCost(productId: string): Promise<Prisma.Decimal> {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        bomItems: {
          include: {
            component: {
              include: {
                costSnapshots: true,
              },
            },
          },
        },
      },
    })

    if (!product) {
      throw new Error('Produit non trouvé')
    }

    let totalComponentCost = new Prisma.Decimal(0)

    for (const bomItem of product.bomItems) {
      const snapshot = bomItem.component.costSnapshots[0]
      const avgCost = snapshot
        ? new Prisma.Decimal(snapshot.avgCost.toString())
        : new Prisma.Decimal(bomItem.component.coutStandard.toString())

      const componentCost = avgCost.times(bomItem.qtyParUnite)
      totalComponentCost = totalComponentCost.plus(componentCost)
    }

    const sousTraitanceCost = new Prisma.Decimal(product.coutSousTraitanceUnite.toString())
    const autresCost = new Prisma.Decimal(product.coutAutresUnite.toString())

    return totalComponentCost.plus(sousTraitanceCost).plus(autresCost)
  }

  /**
   * Calcule le coût total d'un OF
   */
  static async calculateOFCost(ofId: string): Promise<{
    unitCost: Prisma.Decimal
    totalCost: Prisma.Decimal
  }> {
    const of = await prisma.manufacturingOrder.findUnique({
      where: { id: ofId },
    })

    if (!of) {
      throw new Error('OF non trouvé')
    }

    const unitCost = await this.calculateProductUnitCost(of.productId)
    const totalCost = unitCost.times(of.qtyProduite)

    return { unitCost, totalCost }
  }
}
