import { test, expect } from '@playwright/test'

test.describe('Dashboard', () => {
  test('should display dashboard statistics', async ({ page }) => {
    await page.goto('/dashboard')

    // Vérifier le titre
    await expect(page.locator('h1')).toContainText('Tableau de bord')

    // Vérifier la présence des cartes de statistiques
    await expect(page.locator('text=OF en cours')).toBeVisible()
    await expect(page.locator('text=Stock PF (DEPOT)')).toBeVisible()
    await expect(page.locator('text=Stock PF (PIPCOS)')).toBeVisible()
    await expect(page.locator('text=Valeur stock composants')).toBeVisible()
  })

  test('should navigate through menu', async ({ page }) => {
    await page.goto('/dashboard')

    // Vérifier la présence du menu
    await expect(page.locator('text=Produits finis')).toBeVisible()
    await expect(page.locator('text=Composants')).toBeVisible()
    await expect(page.locator('text=Ordres de fabrication')).toBeVisible()

    // Naviguer vers les produits
    await page.click('text=Produits finis')
    await expect(page.url()).toContain('/dashboard/products')
    await expect(page.locator('h1')).toContainText('Produits finis')
  })
})
