# Bikarpharma SaaS

Application SaaS de gestion de sous-traitance pour Bikarpharma - Gestion des flux avec le façonnier Pipcos.

## Stack Technique

- **Frontend**: Next.js 14 (App Router), TypeScript, TailwindCSS, shadcn/ui
- **Backend**: Next.js API Routes, Prisma ORM
- **Base de données**: PostgreSQL 15+
- **Authentification**: NextAuth avec Email/Magic Link
- **Gestion d'état**: React Query
- **Tables**: TanStack Table
- **Formulaires**: React Hook Form + Zod

## Fonctionnalités

- Gestion des produits finis et composants
- Nomenclatures (BOM)
- Gestion des fournisseurs et factures d'achat
- Réception de marchandises avec calcul du coût moyen pondéré
- Mouvements de stock typés (entrées, sorties, productions, retours, transferts)
- Ordres de fabrication (OF) avec rapprochement des quantités
- Validation stricte : aucun stock négatif autorisé
- Calcul automatique des coûts (composants + sous-traitance)
- Tableau de bord et rapports
- RBAC (ADMIN, OPERATEUR, LECTURE)
- Audit logs

## Installation

### Prérequis

- Node.js 18+
- npm ou pnpm
- Docker et Docker Compose

### Étapes

1. **Cloner le dépôt et installer les dépendances**

```bash
cd bikarpharma-saas
npm install
# ou
pnpm install
```

2. **Démarrer PostgreSQL avec Docker**

```bash
docker-compose up -d
```

3. **Configurer les variables d'environnement**

```bash
cp .env.example .env
```

Modifiez `.env` si nécessaire (la configuration par défaut fonctionne avec Docker Compose).

4. **Initialiser la base de données**

```bash
npm run db:push
# ou pour des migrations formelles
npm run db:migrate
```

5. **Peupler avec les données de test (scénario BICAR200)**

```bash
npm run db:seed
```

Cette commande créera :
- 6 composants avec stocks initiaux
- 1 produit fini BICAR200 avec sa nomenclature
- 1 OF (OF-2025-002) avec le scénario complet :
  - Sortie de 5000 unités de chaque composant vers Pipcos
  - Production de 4900 BICAR200
  - Transfert de 4900 BICAR200 vers le dépôt
  - Retour de 40 unités de chaque composant depuis Pipcos
- Vérifications automatiques des stocks et coûts

6. **Lancer l'application en développement**

```bash
npm run dev
```

L'application sera disponible sur `http://localhost:3000`

7. **Connexion**

Un utilisateur admin est créé lors du seed :
- Email: `admin@bikarpharma.com`

En mode développement sans serveur SMTP configuré, vérifiez les logs de la console pour le lien magique de connexion.

## Scripts Disponibles

```bash
npm run dev          # Démarrer en mode développement
npm run build        # Build pour production
npm run start        # Démarrer en production
npm run lint         # Linter
npm run type-check   # Vérification TypeScript

# Base de données
npm run db:push      # Push le schéma sans migrations
npm run db:migrate   # Créer et appliquer des migrations
npm run db:seed      # Peupler avec les données de test
npm run db:studio    # Ouvrir Prisma Studio
npm run db:reset     # Réinitialiser la DB

# Tests
npm run test         # Tests unitaires (Vitest)
npm run test:e2e     # Tests E2E (Playwright)
```

## Structure du Projet

```
bikarpharma-saas/
├── prisma/
│   ├── schema.prisma          # Modèle de données
│   └── seed.ts                # Données de test
├── src/
│   ├── app/
│   │   ├── (dashboard)/       # Pages protégées
│   │   │   ├── dashboard/     # Tableau de bord
│   │   │   ├── products/      # Gestion produits
│   │   │   ├── components/    # Gestion composants
│   │   │   ├── suppliers/     # Gestion fournisseurs
│   │   │   ├── invoices/      # Factures d'achat
│   │   │   ├── movements/     # Mouvements de stock
│   │   │   ├── of/            # Ordres de fabrication
│   │   │   └── reports/       # Rapports
│   │   ├── api/               # API Routes
│   │   │   ├── auth/          # NextAuth
│   │   │   ├── movements/     # API mouvements
│   │   │   ├── of/            # API OF
│   │   │   └── ...
│   │   └── auth/              # Pages d'authentification
│   ├── components/
│   │   ├── ui/                # Composants shadcn/ui
│   │   └── sidebar.tsx        # Navigation
│   ├── lib/
│   │   ├── prisma.ts          # Client Prisma
│   │   ├── auth.ts            # Configuration NextAuth
│   │   ├── stock.service.ts   # Logique métier stock
│   │   └── utils.ts           # Utilitaires
│   └── types/
├── docker-compose.yml         # PostgreSQL
└── package.json
```

## Règles Métier Critiques

### 1. Gestion des Stocks

- **Validation stricte** : aucun mouvement ne peut créer un stock négatif
- Calcul en temps réel après chaque mouvement : `qty_on_hand = Σ mouvements`
- Stocks indexés par `(item_type, item_id, location_id)`

### 2. Coût Moyen Pondéré

Recalculé automatiquement à chaque réception de marchandises :

```
avg_cost_new = (qty_actuelle * avg_cost_actuel + qty_reçue * unit_cost) / (qty_actuelle + qty_reçue)
```

### 3. Mouvements Typés

- `ENTREE_DEPOT` : Achats → `toLocation=DEPOT`
- `SORTIE_VERS_PIPCOS` : Allocation à un OF → `fromLocation=DEPOT, toLocation=PIPCOS`
- `PRODUCTION_FINI` : Déclaration de production → `toLocation=PIPCOS, itemType=PRODUCT`
- `TRANSFERT_FINI_VERS_DEPOT` : Transfert PF → `fromLocation=PIPCOS, toLocation=DEPOT`
- `RETOUR_DE_PIPCOS` : Excédents composants → `fromLocation=PIPCOS, toLocation=DEPOT`

### 4. Rapprochement OF

Pour chaque composant d'un OF :
- **Envoyé** = Σ `SORTIE_VERS_PIPCOS`
- **Retourné** = Σ `RETOUR_DE_PIPCOS`
- **Consommation théorique** = `qty_produite` × `qty_par_unite` (BOM)
- **Reste théorique chez Pipcos** = Envoyé - Retourné - Conso théorique

### 5. Calcul des Coûts

**Coût unitaire PF** :
```
Σ (BOM.qty × coût_utilisé_composant) + coût_sous_traitance_unite + coût_autres_unite
```

où `coût_utilisé_composant` = `avg_cost` si > 0 sinon `cost_standard`

**Coût OF total** = `coût_unitaire_PF` × `qty_produite`

## Scénario de Test BICAR200

Le seed crée automatiquement un scénario complet :

### Données Initiales

- 6 composants avec stocks :
  - FLACON200 : 7000 unités @ 0.280 TND
  - ETIQ_BICAR200 : 10000 unités @ 0.050 TND
  - NOTICE_BICAR : 10000 unités @ 0.040 TND
  - ETUI_BICAR200 : 7000 unités @ 0.120 TND
  - BOUCHON_PP28 : 10000 unités @ 0.090 TND
  - GOBLET_DOSEUR : 7000 unités @ 0.070 TND

- Produit BICAR200 :
  - BOM : 1:1:1:1:1:1 (tous les composants)
  - Coût sous-traitance : 0.250 TND/u
  - Coût autres : 0.000 TND/u

### Flux OF-2025-002

1. **Sortie vers Pipcos** : 5000 unités de chaque composant
2. **Production** : 4900 BICAR200 @ Pipcos
3. **Transfert** : 4900 BICAR200 → Dépôt
4. **Retours** : 40 unités de chaque composant → Dépôt

### Assertions de Validation

Vérifiées automatiquement lors du seed :

- Stock composants DEPOT : `initial - 5000 + 40` par composant
- Stock composants PIPCOS : 60 par composant (reste théorique)
- Stock PF DEPOT : 4900
- Stock PF PIPCOS : 0
- Coût PF unitaire : 0.900 TND (0.650 composants + 0.250 sous-traitance)
- Coût OF total : 4410.000 TND

## Tests

### Tests Unitaires

```bash
npm run test
```

Testent la logique métier :
- Validation des mouvements
- Calcul du coût moyen pondéré
- Détection des stocks négatifs
- Calcul des coûts de production

### Tests E2E

```bash
npm run test:e2e
```

Valident les flux complets :
- Authentification
- Création d'OF
- Mouvements de stock
- Rapprochement OF
- Calculs de coûts

## Configuration NextAuth (Production)

Pour la production, configurez un serveur SMTP dans `.env` :

```env
EMAIL_SERVER=smtp://username:password@smtp.example.com:587
EMAIL_FROM=noreply@votre-domaine.com
NEXTAUTH_SECRET=<générez avec: openssl rand -base64 32>
NEXTAUTH_URL=https://votre-domaine.com
```

## Sécurité

- RBAC avec 3 rôles : ADMIN, OPERATEUR, LECTURE
- Validation Zod sur toutes les API routes
- Audit logs sur les actions critiques
- Protection CSRF via NextAuth
- Variables d'environnement pour les secrets

## Licence

Propriétaire - Bikarpharma © 2025
