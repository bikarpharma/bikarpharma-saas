import { test as setup, expect } from '@playwright/test'

const authFile = 'tests-e2e/.auth/user.json'

setup('authenticate as admin', async ({ page }) => {
  // Aller sur la page de connexion
  await page.goto('/auth/signin')

  // Remplir le formulaire de connexion
  await page.fill('input[type="email"]', 'admin@bikarpharma.com')
  
  // Soumettre le formulaire
  await page.click('button[type="submit"]')

  // Attendre la redirection (en production avec email magic link)
  // Pour les tests, on simule une session authentifiée
  await page.waitForURL('/dashboard')

  // Sauvegarder l'état d'authentification
  await page.context().storageState({ path: authFile })
})
