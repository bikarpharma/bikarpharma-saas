import { test, expect } from '@playwright/test'

test.describe('BICAR200 Complete Workflow', () => {
  test.describe.configure({ mode: 'serial' })

  test('should verify initial state', async ({ page }) => {
    await page.goto('/dashboard')

    // Vérifier les statistiques du dashboard
    await expect(page.locator('h1')).toContainText('Tableau de bord')
  })

  test('should verify BICAR200 product exists', async ({ page }) => {
    await page.goto('/dashboard/products')

    // Chercher BICAR200 dans la liste
    await expect(page.locator('text=BICAR200')).toBeVisible()
  })

  test('should verify components stock', async ({ page }) => {
    await page.goto('/dashboard/components')

    // Vérifier la présence des composants BICAR200
    const components = [
      'FLACON200',
      'ETIQ_BICAR200',
      'NOTICE_BICAR',
      'ETUI_BICAR200',
      'BOUCHON_PP28',
      'GOBLET_DOSEUR',
    ]

    for (const component of components) {
      await expect(page.locator(`text=${component}`)).toBeVisible()
    }
  })

  test('should verify OF-2025-002 exists', async ({ page }) => {
    await page.goto('/dashboard/of')

    // Vérifier la présence de l'OF
    await expect(page.locator('text=OF-2025-002')).toBeVisible()
    
    // Vérifier les quantités
    await expect(page.locator('text=5000')).toBeVisible() // Qté commandée
    await expect(page.locator('text=4900')).toBeVisible() // Qté produite
  })

  test('should verify stock reports', async ({ page }) => {
    await page.goto('/dashboard/reports')

    // Vérifier le titre
    await expect(page.locator('h1')).toContainText('Rapports')

    // Vérifier la présence des sections
    await expect(page.locator('text=Stock des composants')).toBeVisible()
    await expect(page.locator('text=Stock des produits finis')).toBeVisible()
  })

  test('should navigate through complete workflow', async ({ page }) => {
    // 1. Dashboard
    await page.goto('/dashboard')
    await expect(page.locator('h1')).toContainText('Tableau de bord')

    // 2. Produits
    await page.click('text=Produits finis')
    await expect(page.url()).toContain('/dashboard/products')

    // 3. Composants
    await page.click('text=Composants')
    await expect(page.url()).toContain('/dashboard/components')

    // 4. OF
    await page.click('text=Ordres de fabrication')
    await expect(page.url()).toContain('/dashboard/of')

    // 5. Rapports
    await page.click('text=Rapports')
    await expect(page.url()).toContain('/dashboard/reports')
  })
})
