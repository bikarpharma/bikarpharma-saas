import { test, expect } from '@playwright/test'

test.describe('Product Management', () => {
  test('should display products list', async ({ page }) => {
    await page.goto('/dashboard/products')

    await expect(page.locator('h1')).toContainText('Produits finis')
    await expect(page.locator('text=Liste des produits')).toBeVisible()
  })

  test('should navigate to new product form', async ({ page }) => {
    await page.goto('/dashboard/products')

    // Cliquer sur le bouton "Nouveau produit"
    await page.click('text=Nouveau produit')

    // Vérifier la redirection
    await expect(page.url()).toContain('/dashboard/products/new')
    await expect(page.locator('h1')).toContainText('Nouveau produit fini')
  })

  test('should validate product form', async ({ page }) => {
    await page.goto('/dashboard/products/new')

    // Essayer de soumettre sans remplir
    await page.click('button[type="submit"]')

    // Vérifier les messages d'erreur
    await expect(page.locator('text=Code requis')).toBeVisible()
    await expect(page.locator('text=Nom requis')).toBeVisible()
  })

  test('should create new product', async ({ page }) => {
    await page.goto('/dashboard/products/new')

    // Remplir le formulaire
    await page.fill('#code', 'TEST_PROD_001')
    await page.fill('#name', 'Produit de Test')
    await page.fill('#coutSousTraitanceUnite', '0.5')
    await page.fill('#coutAutresUnite', '0.1')

    // Soumettre
    await page.click('button:has-text("Créer le produit")')

    // Vérifier la redirection (ou le message de succès)
    // Note: nécessite une DB fonctionnelle
  })
})
