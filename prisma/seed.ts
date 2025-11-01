import { PrismaClient, Prisma } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Début du seed...')

  // 1. Créer les emplacements
  console.log('📍 Création des emplacements...')
  const locationDepot = await prisma.location.upsert({
    where: { code: 'DEPOT' },
    update: {},
    create: { code: 'DEPOT', name: 'Dépôt Bikarpharma' },
  })

  const locationPipcos = await prisma.location.upsert({
    where: { code: 'PIPCOS' },
    update: {},
    create: { code: 'PIPCOS', name: 'Pipcos (Sous-traitant)' },
  })

  console.log(`✅ Emplacements créés: ${locationDepot.name}, ${locationPipcos.name}`)

  // 2. Créer les composants
  console.log('🧩 Création des composants...')
  const components = [
    { code: 'FLACON200', name: 'Flacon 200ml', coutStandard: 0.28, qty: 7000 },
    { code: 'ETIQ_BICAR200', name: 'Étiquette BICAR 200', coutStandard: 0.05, qty: 10000 },
    { code: 'NOTICE_BICAR', name: 'Notice BICAR', coutStandard: 0.04, qty: 10000 },
    { code: 'ETUI_BICAR200', name: 'Étui BICAR 200', coutStandard: 0.12, qty: 7000 },
    { code: 'BOUCHON_PP28', name: 'Bouchon PP28', coutStandard: 0.09, qty: 10000 },
    { code: 'GOBLET_DOSEUR', name: 'Gobelet doseur', coutStandard: 0.07, qty: 7000 },
  ]

  const createdComponents = []
  for (const comp of components) {
    const component = await prisma.component.upsert({
      where: { code: comp.code },
      update: {},
      create: {
        code: comp.code,
        name: comp.name,
        uom: 'pièce',
        coutStandard: new Prisma.Decimal(comp.coutStandard),
      },
    })
    createdComponents.push({ ...component, initialQty: comp.qty })
    console.log(`  ✓ ${component.name} - ${comp.coutStandard} TND`)
  }

  // 3. Créer le fournisseur et la facture
  console.log('🏭 Création du fournisseur et de la facture...')
  const supplier = await prisma.supplier.upsert({
    where: { name: 'Fournisseur Principal' },
    update: {},
    create: {
      name: 'Fournisseur Principal',
      contact: 'Contact Principal',
      email: 'contact@fournisseur.tn',
      phone: '+216 71 123 456',
    },
  })

  const invoice = await prisma.purchaseInvoice.upsert({
    where: {
      supplierId_invoiceNo: {
        supplierId: supplier.id,
        invoiceNo: 'FACT-2025-001',
      },
    },
    update: {},
    create: {
      supplierId: supplier.id,
      invoiceNo: 'FACT-2025-001',
      invoiceDate: new Date('2025-01-15'),
      currency: 'TND',
    },
  })

  // 4. Créer les réceptions de marchandises et les mouvements d'entrée
  console.log('📦 Création des réceptions et stocks initiaux...')
  for (const comp of createdComponents) {
    await prisma.goodsReceipt.create({
      data: {
        purchaseInvoiceId: invoice.id,
        componentId: comp.id,
        lot: 'LOT-2025-001',
        qty: comp.initialQty,
        unitCost: comp.coutStandard,
        locationId: locationDepot.id,
      },
    })

    // Créer le mouvement d'entrée
    await prisma.movement.create({
      data: {
        type: 'ENTREE_DEPOT',
        itemType: 'COMPONENT',
        itemId: comp.id,
        lot: 'LOT-2025-001',
        qty: comp.initialQty,
        toLocationId: locationDepot.id,
        reference: invoice.invoiceNo,
      },
    })

    // Créer le solde de stock
    await prisma.stockBalance.create({
      data: {
        itemType: 'COMPONENT',
        itemId: comp.id,
        locationId: locationDepot.id,
        qtyOnHand: comp.initialQty,
      },
    })

    // Créer le snapshot de coût moyen
    await prisma.costComponentSnapshot.create({
      data: {
        componentId: comp.id,
        avgCost: comp.coutStandard,
      },
    })

    console.log(`  ✓ Stock ${comp.name}: ${comp.initialQty} unités`)
  }

  // 5. Créer le produit BICAR200
  console.log('🏭 Création du produit BICAR200...')
  const product = await prisma.product.upsert({
    where: { code: 'BICAR200' },
    update: {},
    create: {
      code: 'BICAR200',
      name: 'BICAR 200ml',
      uom: 'pièce',
      coutSousTraitanceUnite: new Prisma.Decimal(0.25),
      coutAutresUnite: new Prisma.Decimal(0),
    },
  })

  // 6. Créer la nomenclature (BOM)
  console.log('📋 Création de la nomenclature...')
  for (const comp of createdComponents) {
    await prisma.bomItem.upsert({
      where: {
        productId_componentId: {
          productId: product.id,
          componentId: comp.id,
        },
      },
      update: {},
      create: {
        productId: product.id,
        componentId: comp.id,
        qtyParUnite: new Prisma.Decimal(1),
      },
    })
    console.log(`  ✓ BOM: ${comp.name} x 1`)
  }

  // 7. Créer l'ordre de fabrication OF-2025-002
  console.log('🔧 Création de l\'OF-2025-002...')
  const of = await prisma.manufacturingOrder.upsert({
    where: { ofCode: 'OF-2025-002' },
    update: {},
    create: {
      ofCode: 'OF-2025-002',
      productId: product.id,
      qtyCommandee: 5000,
      dateLancement: new Date('2025-01-20'),
      statut: 'EN_COURS',
    },
  })

  console.log(`✅ OF créé: ${of.ofCode} pour ${of.qtyCommandee} ${product.name}`)

  // 8. Scénario BICAR200: Sorties vers Pipcos
  console.log('📤 Sortie de 5000 unités de chaque composant vers Pipcos...')
  for (const comp of createdComponents) {
    await prisma.movement.create({
      data: {
        type: 'SORTIE_VERS_PIPCOS',
        ofId: of.id,
        itemType: 'COMPONENT',
        itemId: comp.id,
        lot: 'LOT-2025-001',
        qty: 5000,
        fromLocationId: locationDepot.id,
        toLocationId: locationPipcos.id,
      },
    })

    // Mettre à jour les stocks
    await prisma.stockBalance.update({
      where: {
        itemType_itemId_locationId: {
          itemType: 'COMPONENT',
          itemId: comp.id,
          locationId: locationDepot.id,
        },
      },
      data: { qtyOnHand: { decrement: 5000 } },
    })

    await prisma.stockBalance.create({
      data: {
        itemType: 'COMPONENT',
        itemId: comp.id,
        locationId: locationPipcos.id,
        qtyOnHand: 5000,
      },
    })

    console.log(`  ✓ Sortie ${comp.name}: 5000 unités`)
  }

  // 9. Production de 4900 BICAR200
  console.log('🏭 Production de 4900 BICAR200...')
  await prisma.movement.create({
    data: {
      type: 'PRODUCTION_FINI',
      ofId: of.id,
      itemType: 'PRODUCT',
      itemId: product.id,
      lot: 'LOT-BICAR200-001',
      qty: 4900,
      toLocationId: locationPipcos.id,
    },
  })

  await prisma.manufacturingOrder.update({
    where: { id: of.id },
    data: {
      qtyProduite: 4900,
      lotFini: 'LOT-BICAR200-001',
    },
  })

  await prisma.stockBalance.create({
    data: {
      itemType: 'PRODUCT',
      itemId: product.id,
      locationId: locationPipcos.id,
      qtyOnHand: 4900,
    },
  })

  // Consommer les composants chez Pipcos
  for (const comp of createdComponents) {
    await prisma.stockBalance.update({
      where: {
        itemType_itemId_locationId: {
          itemType: 'COMPONENT',
          itemId: comp.id,
          locationId: locationPipcos.id,
        },
      },
      data: { qtyOnHand: { decrement: 4900 } },
    })
  }

  console.log(`✅ Production: 4900 ${product.name}`)

  // 10. Transfert vers dépôt
  console.log('🚚 Transfert de 4900 BICAR200 vers le dépôt...')
  await prisma.movement.create({
    data: {
      type: 'TRANSFERT_FINI_VERS_DEPOT',
      itemType: 'PRODUCT',
      itemId: product.id,
      lot: 'LOT-BICAR200-001',
      qty: 4900,
      fromLocationId: locationPipcos.id,
      toLocationId: locationDepot.id,
    },
  })

  await prisma.stockBalance.update({
    where: {
      itemType_itemId_locationId: {
        itemType: 'PRODUCT',
        itemId: product.id,
        locationId: locationPipcos.id,
      },
    },
    data: { qtyOnHand: { decrement: 4900 } },
  })

  await prisma.stockBalance.create({
    data: {
      itemType: 'PRODUCT',
      itemId: product.id,
      locationId: locationDepot.id,
      qtyOnHand: 4900,
    },
  })

  console.log(`✅ Transfert: 4900 ${product.name} au dépôt`)

  // 11. Retours de Pipcos
  console.log('🔙 Retour de 40 unités de chaque composant depuis Pipcos...')
  for (const comp of createdComponents) {
    await prisma.movement.create({
      data: {
        type: 'RETOUR_DE_PIPCOS',
        ofId: of.id,
        itemType: 'COMPONENT',
        itemId: comp.id,
        lot: 'LOT-2025-001',
        qty: 40,
        fromLocationId: locationPipcos.id,
        toLocationId: locationDepot.id,
      },
    })

    await prisma.stockBalance.update({
      where: {
        itemType_itemId_locationId: {
          itemType: 'COMPONENT',
          itemId: comp.id,
          locationId: locationPipcos.id,
        },
      },
      data: { qtyOnHand: { decrement: 40 } },
    })

    await prisma.stockBalance.update({
      where: {
        itemType_itemId_locationId: {
          itemType: 'COMPONENT',
          itemId: comp.id,
          locationId: locationDepot.id,
        },
      },
      data: { qtyOnHand: { increment: 40 } },
    })

    console.log(`  ✓ Retour ${comp.name}: 40 unités`)
  }

  // 12. Vérifications finales
  console.log('\n🔍 Vérifications du scénario BICAR200...')

  // Vérifier les stocks
  const depotComponentBalances = await prisma.stockBalance.findMany({
    where: { itemType: 'COMPONENT', locationId: locationDepot.id },
  })

  const pipcosComponentBalances = await prisma.stockBalance.findMany({
    where: { itemType: 'COMPONENT', locationId: locationPipcos.id },
  })

  const productBalances = await prisma.stockBalance.findMany({
    where: { itemType: 'PRODUCT' },
  })

  console.log('\n📊 Stocks composants au dépôt:')
  for (const balance of depotComponentBalances) {
    const comp = createdComponents.find((c) => c.id === balance.itemId)
    const expected = comp ? comp.initialQty - 5000 + 40 : 0
    const status = balance.qtyOnHand === expected ? '✅' : '❌'
    console.log(`  ${status} ${comp?.name}: ${balance.qtyOnHand} (attendu: ${expected})`)
  }

  console.log('\n📊 Stocks composants chez Pipcos (reste théorique):')
  for (const balance of pipcosComponentBalances) {
    const comp = createdComponents.find((c) => c.id === balance.itemId)
    const expected = 60 // 5000 - 4900 - 40
    const status = balance.qtyOnHand === expected ? '✅' : '❌'
    console.log(`  ${status} ${comp?.name}: ${balance.qtyOnHand} (attendu: ${expected})`)
  }

  console.log('\n📊 Stocks produits finis:')
  for (const balance of productBalances) {
    const location = balance.locationId === locationDepot.id ? 'DEPOT' : 'PIPCOS'
    const expectedDepot = 4900
    const expectedPipcos = 0
    const expected = balance.locationId === locationDepot.id ? expectedDepot : expectedPipcos
    const status = balance.qtyOnHand === expected ? '✅' : '❌'
    console.log(`  ${status} ${location}: ${balance.qtyOnHand} (attendu: ${expected})`)
  }

  // Calculer le coût
  const totalComponentCost = createdComponents.reduce(
    (sum, comp) => sum + parseFloat(comp.coutStandard.toString()),
    0
  )
  const unitCost = totalComponentCost + 0.25
  const totalOFCost = unitCost * 4900

  console.log('\n💰 Calculs de coût:')
  console.log(`  ✅ Coût composants unitaire: ${totalComponentCost.toFixed(3)} TND`)
  console.log(`  ✅ Coût sous-traitance unitaire: 0.250 TND`)
  console.log(`  ✅ Coût PF unitaire: ${unitCost.toFixed(3)} TND (attendu: 0.900 TND)`)
  console.log(`  ✅ Coût OF total: ${totalOFCost.toFixed(3)} TND (attendu: 4410.000 TND)`)

  // Créer un utilisateur admin pour les tests
  console.log('\n👤 Création d\'un utilisateur admin...')
  await prisma.user.upsert({
    where: { email: 'admin@bikarpharma.com' },
    update: {},
    create: {
      email: 'admin@bikarpharma.com',
      name: 'Administrateur',
      role: 'ADMIN',
    },
  })

  console.log('\n✨ Seed terminé avec succès!')
  console.log('\n📝 Résumé:')
  console.log(`  - Composants: ${createdComponents.length}`)
  console.log(`  - Produit: ${product.name}`)
  console.log(`  - OF: ${of.ofCode} (${of.qtyCommandee} commandés, ${of.qtyProduite} produits)`)
  console.log(`  - Stock PF dépôt: 4900`)
  console.log(`  - Reste théorique composants chez Pipcos: 60 par composant`)
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
