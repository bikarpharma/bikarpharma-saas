import { test, expect } from '@playwright/test'

test.describe('Manufacturing Order Workflow', () => {
  test('should create new OF', async ({ page }) => {
    await page.goto('/dashboard/of/new')

    // Vérifier le titre
    await expect(page.locator('h1')).toContainText('Nouvel ordre de fabrication')

    // Remplir le formulaire
    await page.fill('#ofCode', 'OF-TEST-001')
    await page.fill('#qtyCommandee', '1000')
    await page.fill('#dateLancement', '2025-11-01')

    // Sélectionner un produit (si disponible dans la liste)
    // await page.click('[name="productId"]')
    // await page.click('text=BICAR200')

    // Note: La soumission nécessite une DB fonctionnelle
  })

  test('should display OF list', async ({ page }) => {
    await page.goto('/dashboard/of')

    await expect(page.locator('h1')).toContainText('Ordres de fabrication')
    await expect(page.locator('text=Liste des ordres de fabrication')).toBeVisible()
  })

  test('should validate OF form fields', async ({ page }) => {
    await page.goto('/dashboard/of/new')

    // Soumettre sans remplir
    await page.click('button[type="submit"]')

    // Vérifier les erreurs
    await expect(page.locator('text=Code OF requis')).toBeVisible()
    await expect(page.locator('text=Quantité requise')).toBeVisible()
  })
})
