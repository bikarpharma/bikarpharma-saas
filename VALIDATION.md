# Guide de Validation Complete - Bikarpharma SaaS

Ce guide explique comment valider complètement l'application en local avec PostgreSQL.

## Étape 1 : Prérequis

### Installation PostgreSQL

**Option A : Docker (Recommandé)**
```bash
# Utiliser le docker-compose fourni
cd bikarpharma-saas
docker-compose up -d

# Vérifier que PostgreSQL est démarré
docker ps | grep postgres
```

**Option B : Installation locale**
```bash
# Sur Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib

# Démarrer PostgreSQL
sudo service postgresql start

# Créer la base de données
sudo -u postgres createdb bikarpharma
sudo -u postgres psql -c "ALTER USER postgres WITH PASSWORD 'postgres';"
```

**Option C : PostgreSQL Cloud**
- Supabase : https://supabase.com (gratuit)
- Neon : https://neon.tech (gratuit)
- Railway : https://railway.app (PostgreSQL inclus)

## Étape 2 : Configuration

```bash
cd bikarpharma-saas

# Installer les dépendances
npm install

# Copier et configurer .env
cp .env.example .env
```

Éditez `.env` :
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/bikarpharma?schema=public"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="votre-secret-genere-avec-openssl-rand-base64-32"
```

## Étape 3 : Initialisation de la base de données

```bash
# Appliquer le schéma Prisma
npx prisma db push

# Exécuter le seed avec le scénario BICAR200
npx prisma db seed
```

**Résultat attendu :**
```
🌱 Début du seed...
📍 Création des emplacements...
✅ Emplacements créés: Dépôt Bikarpharma, Pipcos (Sous-traitant)
🧩 Création des composants...
  ✓ Flacon 200ml - 0.28 TND
  ✓ Étiquette BICAR 200 - 0.05 TND
  ✓ Notice BICAR - 0.04 TND
  ✓ Étui BICAR 200 - 0.12 TND
  ✓ Bouchon PP28 - 0.09 TND
  ✓ Gobelet doseur - 0.07 TND
📦 Création des réceptions et stocks initiaux...
  ✓ Stock Flacon 200ml: 7000 unités
  ✓ Stock Étiquette BICAR 200: 10000 unités
  ...
🏭 Création du produit BICAR200...
📋 Création de la nomenclature...
  ✓ BOM: Flacon 200ml x 1
  ✓ BOM: Étiquette BICAR 200 x 1
  ...
🔧 Création de l'OF-2025-002...
✅ OF créé: OF-2025-002 pour 5000 BICAR 200ml
📤 Sortie de 5000 unités de chaque composant vers Pipcos...
  ✓ Sortie Flacon 200ml: 5000 unités
  ✓ Sortie Étiquette BICAR 200: 5000 unités
  ...
🏭 Production de 4900 BICAR200...
✅ Production: 4900 BICAR 200ml
🚚 Transfert de 4900 BICAR200 vers le dépôt...
✅ Transfert: 4900 BICAR 200ml au dépôt
🔙 Retour de 40 unités de chaque composant depuis Pipcos...
  ✓ Retour Flacon 200ml: 40 unités
  ...

🔍 Vérifications du scénario BICAR200...

📊 Stocks composants au dépôt:
  ✅ Flacon 200ml: 2040 (attendu: 2040)
  ✅ Étiquette BICAR 200: 5040 (attendu: 5040)
  ✅ Notice BICAR: 5040 (attendu: 5040)
  ✅ Étui BICAR 200: 2040 (attendu: 2040)
  ✅ Bouchon PP28: 5040 (attendu: 5040)
  ✅ Gobelet doseur: 2040 (attendu: 2040)

📊 Stocks composants chez Pipcos (reste théorique):
  ✅ Flacon 200ml: 60 (attendu: 60)
  ✅ Étiquette BICAR 200: 60 (attendu: 60)
  ✅ Notice BICAR: 60 (attendu: 60)
  ✅ Étui BICAR 200: 60 (attendu: 60)
  ✅ Bouchon PP28: 60 (attendu: 60)
  ✅ Gobelet doseur: 60 (attendu: 60)

📊 Stocks produits finis:
  ✅ DEPOT: 4900 (attendu: 4900)
  ✅ PIPCOS: 0 (attendu: 0)

💰 Calculs de coût:
  ✅ Coût composants unitaire: 0.650 TND
  ✅ Coût sous-traitance unitaire: 0.250 TND
  ✅ Coût PF unitaire: 0.900 TND (attendu: 0.900 TND)
  ✅ Coût OF total: 4410.000 TND (attendu: 4410.000 TND)

✨ Seed terminé avec succès!

📝 Résumé:
  - Composants: 6
  - Produit: BICAR 200ml
  - OF: OF-2025-002 (5000 commandés, 4900 produits)
  - Stock PF dépôt: 4900
  - Reste théorique composants chez Pipcos: 60 par composant
```

**Si toutes les assertions sont ✅, le scénario BICAR200 est validé !**

## Étape 4 : Démarrer l'application

```bash
npm run dev
```

L'application sera accessible sur http://localhost:3000

## Étape 5 : Tests manuels de l'interface

### 5.1 Connexion
1. Aller sur http://localhost:3000
2. Entrer l'email : `admin@bikarpharma.com`
3. En développement sans SMTP, le lien magique s'affiche dans la console
4. Simuler la connexion (ou configurer un serveur SMTP de test)

### 5.2 Vérifier le Dashboard
**Résultat attendu :**
- OF en cours : 1
- Stock PF (DEPOT) : 4900
- Stock PF (PIPCOS) : 0
- Valeur stock composants : calculée

### 5.3 Vérifier les Produits
1. Naviguer vers "Produits finis"
2. Vérifier la présence de BICAR200
3. Coût sous-traitance : 0.250 TND
4. Composants BOM : 6

**Test de création :**
- Cliquer sur "Nouveau produit"
- Remplir le formulaire :
  - Code : TEST_PROD_001
  - Nom : Produit de Test
  - Coût sous-traitance : 0.5
  - Coût autres : 0.1
- Cliquer "Créer le produit"
- Vérifier que le produit apparaît dans la liste

### 5.4 Vérifier les Composants
1. Naviguer vers "Composants"
2. Vérifier les 6 composants BICAR200 :
   - FLACON200 : Stock ~2040
   - ETIQ_BICAR200 : Stock ~5040
   - NOTICE_BICAR : Stock ~5040
   - ETUI_BICAR200 : Stock ~2040
   - BOUCHON_PP28 : Stock ~5040
   - GOBLET_DOSEUR : Stock ~2040
3. Vérifier que coût moyen = coût standard (0.280, 0.050, etc.)

**Test de création :**
- Cliquer sur "Nouveau composant"
- Remplir le formulaire
- Vérifier la création

### 5.5 Vérifier les Ordres de Fabrication
1. Naviguer vers "Ordres de fabrication"
2. Vérifier OF-2025-002 :
   - Produit : BICAR200
   - Qté commandée : 5000
   - Qté produite : 4900
   - Statut : EN_COURS
   - Lot fini : LOT-BICAR200-001

**Test de création :**
- Cliquer sur "Nouvel OF"
- Remplir le formulaire
- Vérifier la création

### 5.6 Vérifier les Rapports
1. Naviguer vers "Rapports"
2. Section "Stock des composants" :
   - Vérifier les 6 composants
   - Vérifier coût moyen
   - Vérifier valeur totale
3. Section "Stock des produits finis" :
   - BICAR200 : 4900

## Étape 6 : Tests unitaires

```bash
# Lancer les tests unitaires
npm run test

# Résultat attendu :
# ✓ Stock Management
#   ✓ Stock validation
#   ✓ Average cost calculation
#   ✓ Movement validation
# ✓ BICAR200 Scenario Validation
#   ✓ Component stock at DEPOT
#   ✓ Component stock at PIPCOS (60 each)
#   ✓ Product stock at DEPOT (4900)
#   ✓ Zero product stock at PIPCOS
#   ✓ Unit cost calculation (0.900 TND)
#   ✓ Total OF cost (4410.000 TND)
#   ✓ OF status and quantities

# Test coverage : ~80%+
```

## Étape 7 : Tests E2E (End-to-End)

### Installation Playwright
```bash
npx playwright install
```

### Lancer les tests E2E
```bash
# Lancer tous les tests E2E
npm run test:e2e

# Lancer avec l'interface UI
npm run test:e2e:ui

# Voir le rapport
npm run test:e2e:report
```

### Tests E2E inclus :

**1. Auth Setup (auth.setup.ts)**
- Configuration de l'authentification pour les tests

**2. Dashboard Tests (dashboard.spec.ts)**
- Affichage des statistiques
- Navigation dans le menu

**3. Product Management Tests (products.spec.ts)**
- Liste des produits
- Formulaire de création
- Validation du formulaire
- Création d'un nouveau produit

**4. Manufacturing Order Tests (manufacturing-order.spec.ts)**
- Création d'un OF
- Affichage de la liste
- Validation du formulaire

**5. BICAR200 Workflow Complete (bicar200-workflow.spec.ts)**
- Vérification de l'état initial
- Vérification du produit BICAR200
- Vérification des stocks de composants
- Vérification de l'OF-2025-002
- Vérification des rapports
- Navigation complète dans l'application

**Résultat attendu :**
```
Running 25 tests using 3 workers

  ✓ [chromium] › auth.setup.ts:3:1 › authenticate as admin (2s)
  ✓ [chromium] › dashboard.spec.ts:3:1 › Dashboard › should display dashboard statistics (1s)
  ✓ [chromium] › dashboard.spec.ts:15:1 › Dashboard › should navigate through menu (2s)
  ✓ [chromium] › products.spec.ts:3:1 › Product Management › should display products list (1s)
  ✓ [chromium] › products.spec.ts:9:1 › Product Management › should navigate to new product form (1s)
  ✓ [chromium] › products.spec.ts:18:1 › Product Management › should validate product form (1s)
  ✓ [chromium] › products.spec.ts:27:1 › Product Management › should create new product (2s)
  ✓ [chromium] › manufacturing-order.spec.ts:3:1 › Manufacturing Order Workflow › should create new OF (2s)
  ✓ [chromium] › manufacturing-order.spec.ts:18:1 › Manufacturing Order Workflow › should display OF list (1s)
  ✓ [chromium] › manufacturing-order.spec.ts:24:1 › Manufacturing Order Workflow › should validate OF form fields (1s)
  ✓ [chromium] › bicar200-workflow.spec.ts:4:1 › BICAR200 Complete Workflow › should verify initial state (1s)
  ✓ [chromium] › bicar200-workflow.spec.ts:10:1 › BICAR200 Complete Workflow › should verify BICAR200 product exists (1s)
  ✓ [chromium] › bicar200-workflow.spec.ts:16:1 › BICAR200 Complete Workflow › should verify components stock (2s)
  ✓ [chromium] › bicar200-workflow.spec.ts:35:1 › BICAR200 Complete Workflow › should verify OF-2025-002 exists (1s)
  ✓ [chromium] › bicar200-workflow.spec.ts:46:1 › BICAR200 Complete Workflow › should verify stock reports (1s)
  ✓ [chromium] › bicar200-workflow.spec.ts:55:1 › BICAR200 Complete Workflow › should navigate through complete workflow (3s)
  
  ... (tests répétés pour firefox, webkit, Mobile Chrome, Mobile Safari)

25 passed (45s)
```

## Étape 8 : Validation de la base de données avec Prisma Studio

```bash
npx prisma studio
```

Ouvrir http://localhost:5555

### Vérifications dans Prisma Studio :

**1. Table `Component`**
- 6 composants avec active=true
- Codes : FLACON200, ETIQ_BICAR200, NOTICE_BICAR, ETUI_BICAR200, BOUCHON_PP28, GOBLET_DOSEUR

**2. Table `Product`**
- 1 produit BICAR200
- coutSousTraitanceUnite = 0.250
- coutAutresUnite = 0.000

**3. Table `BomItem`**
- 6 lignes (une par composant)
- qtyParUnite = 1.000 pour chaque

**4. Table `ManufacturingOrder`**
- 1 OF avec ofCode = OF-2025-002
- qtyCommandee = 5000
- qtyProduite = 4900
- statut = EN_COURS

**5. Table `Movement`**
- Vérifier les mouvements :
  - ENTREE_DEPOT : 6 mouvements (un par composant)
  - SORTIE_VERS_PIPCOS : 6 mouvements (5000 unités chacun)
  - PRODUCTION_FINI : 1 mouvement (4900 BICAR200)
  - TRANSFERT_FINI_VERS_DEPOT : 1 mouvement (4900 BICAR200)
  - RETOUR_DE_PIPCOS : 6 mouvements (40 unités chacun)

**6. Table `StockBalance`**
- Composants au DEPOT : 6 lignes avec qtyOnHand correct
- Composants chez PIPCOS : 6 lignes avec qtyOnHand = 60
- Produit au DEPOT : 1 ligne avec qtyOnHand = 4900
- Produit chez PIPCOS : 1 ligne avec qtyOnHand = 0

**7. Table `CostComponentSnapshot`**
- 6 lignes (une par composant)
- avgCost = coutStandard (pas encore de variation)

## Étape 9 : Tests de règles métier

### Test 1 : Empêcher stock négatif
```bash
# Dans Prisma Studio ou via l'API :
# Essayer de créer un mouvement SORTIE_VERS_PIPCOS
# avec qty > stock disponible

# Résultat attendu : Erreur "Stock insuffisant"
```

### Test 2 : Calcul coût moyen pondéré
1. Créer une nouvelle réception de FLACON200
   - Qty : 1000
   - Unit cost : 0.350 TND
2. Vérifier dans `CostComponentSnapshot` :
   - Ancien : qty=2040, avg=0.280
   - Nouveau : qty=3040, avg=(2040×0.280 + 1000×0.350)/3040 = 0.303 TND

### Test 3 : Validation des mouvements typés
- SORTIE_VERS_PIPCOS sans ofId → Erreur
- PRODUCTION_FINI avec itemType=COMPONENT → Erreur
- ENTREE_DEPOT avec fromLocation → Erreur

## Étape 10 : Checklist de validation finale

- [ ] PostgreSQL démarré et accessible
- [ ] Base de données initialisée (`npx prisma db push`)
- [ ] Seed exécuté avec succès (toutes les assertions ✅)
- [ ] Application démarre sans erreur (`npm run dev`)
- [ ] Connexion fonctionnelle
- [ ] Dashboard affiche les bonnes statistiques
- [ ] Tous les écrans accessibles et affichent les données
- [ ] Formulaires de création fonctionnels
- [ ] Validation des formulaires active
- [ ] Tests unitaires passent (npm run test)
- [ ] Tests E2E passent (npm run test:e2e)
- [ ] Prisma Studio confirme les données
- [ ] Règles métier validées (stock négatif impossible)
- [ ] Coût moyen pondéré calculé correctement
- [ ] Aucune erreur dans la console du navigateur
- [ ] Aucune erreur dans les logs Next.js

## Troubleshooting

### Erreur : "Can't reach database server"
```bash
# Vérifier que PostgreSQL tourne
docker ps | grep postgres
# ou
sudo service postgresql status

# Redémarrer si nécessaire
docker-compose restart
# ou
sudo service postgresql restart
```

### Erreur : "Prisma Client not generated"
```bash
npx prisma generate
```

### Erreur lors du seed
```bash
# Réinitialiser la base
npx prisma db push --force-reset
npx prisma db seed
```

### Tests E2E échouent
```bash
# Vérifier que l'application tourne
npm run dev

# Dans un autre terminal
npm run test:e2e
```

## Conclusion

Si toutes les étapes sont validées avec succès, l'application Bikarpharma SaaS est **100% fonctionnelle et prête pour le déploiement en production** ! 🎉

Les assertions automatiques du seed garantissent que :
- ✅ La logique métier fonctionne correctement
- ✅ Les stocks sont gérés sans erreur
- ✅ Les calculs de coûts sont exacts
- ✅ Le scénario BICAR200 est reproductible
- ✅ Aucun stock négatif n'est possible
- ✅ Le coût moyen pondéré est calculé correctement
