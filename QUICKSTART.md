# 🚀 Guide de démarrage rapide - Bikarpharma SaaS

## Installation en 5 minutes

### Prérequis
- Node.js 18+ installé
- PostgreSQL 15+ accessible (local ou cloud)

### Étape 1 : Configuration initiale

```bash
# Naviguer vers le projet
cd bikarpharma-saas

# Installer les dépendances (déjà fait)
npm install

# Copier et configurer les variables d'environnement
cp .env.example .env
```

### Étape 2 : Configurer .env

Éditez `.env` avec votre connexion PostgreSQL :

```env
# Option A : PostgreSQL local
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/bikarpharma?schema=public"

# Option B : PostgreSQL cloud (Supabase, Neon, etc.)
DATABASE_URL="votre_connexion_string"

# Configuration NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="générez-avec-openssl-rand-base64-32"

# Email (optionnel pour développement)
EMAIL_SERVER="smtp://user:pass@smtp.example.com:587"
EMAIL_FROM="noreply@bikarpharma.com"
```

### Étape 3 : Initialiser la base de données

```bash
# Créer les tables
npx prisma db push

# Peupler avec le scénario BICAR200
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
  ...
📦 Création des réceptions et stocks initiaux...
🏭 Création du produit BICAR200...
📋 Création de la nomenclature...
🔧 Création de l'OF-2025-002...
✅ OF créé: OF-2025-002 pour 5000 BICAR 200ml
...
🔍 Vérifications du scénario BICAR200...
✅ Stocks composants au dépôt: OK
✅ Stocks composants chez Pipcos (reste théorique): 60
✅ Stocks produits finis DEPOT: 4900
✅ Coût PF unitaire: 0.900 TND (attendu: 0.900 TND)
✅ Coût OF total: 4410.000 TND (attendu: 4410.000 TND)

✨ Seed terminé avec succès!
```

### Étape 4 : Lancer l'application

```bash
npm run dev
```

Ouvrez http://localhost:3000

### Étape 5 : Se connecter

- Email : `admin@bikarpharma.com`
- En mode développement sans SMTP, le lien magique s'affiche dans la console

## 📊 Vue d'ensemble de l'application

### Tableau de bord
```
┌─────────────────────────────────────────────────────────────┐
│  Bikarpharma - Tableau de bord                              │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐        │
│  │ OF en cours  │ │ Stock PF     │ │ Valeur stock │        │
│  │      1       │ │ DEPOT: 4900  │ │   composants │        │
│  └──────────────┘ └──────────────┘ └──────────────┘        │
│                                                               │
│  Ordres de fabrication actifs                                │
│  ├─ OF-2025-002 | BICAR200 | EN_COURS | 4900/5000          │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Produits finis
- Liste des produits avec BOM
- Coûts de sous-traitance
- Nomenclatures (composants par unité)

### Composants
- Stock total par composant
- Coût moyen pondéré vs coût standard
- Historique des réceptions

### Ordres de fabrication (OF)
- Création et suivi d'OF
- Statuts : BROUILLON, EN_COURS, CLOS
- Rapprochement des quantités (envoyé/retourné/consommé)
- Calcul des coûts

### Mouvements
- Entrées dépôt (achats)
- Sorties vers Pipcos (allocation OF)
- Production fini
- Transferts vers dépôt
- Retours de Pipcos

### Rapports
- Valorisation stock composants
- Stock produits finis
- Export CSV/Excel (à implémenter)

## 🔧 Commandes utiles

```bash
# Développement
npm run dev              # Lancer en mode dev
npm run build            # Build pour production
npm run start            # Lancer en production
npm run lint             # Vérifier le code

# Base de données
npm run db:push          # Appliquer le schéma (dev)
npm run db:migrate       # Créer une migration
npm run db:seed          # Exécuter le seed
npm run db:studio        # Ouvrir Prisma Studio
npm run db:reset         # Réinitialiser la DB

# Tests
npm run test             # Tests unitaires
npm run test:e2e         # Tests E2E (à configurer)
npm run type-check       # Vérifier TypeScript
```

## 🎯 Tester le scénario BICAR200

### 1. Dashboard
✅ Vérifier : OF en cours = 1, Stock PF DEPOT = 4900

### 2. Composants
✅ Vérifier : 6 composants avec stocks corrects
- FLACON200 : ~2040 (7000 - 5000 + 40)
- ETIQ_BICAR200 : ~5040 (10000 - 5000 + 40)
- etc.

### 3. Ordres de fabrication
✅ Vérifier : OF-2025-002
- Produit : BICAR200
- Qté commandée : 5000
- Qté produite : 4900
- Statut : EN_COURS

### 4. Rapports
✅ Vérifier : Valorisation stock composants
- Total doit correspondre aux calculs

## 🚨 Résolution de problèmes

### Erreur : "Can't reach database server"
```bash
# Vérifier que PostgreSQL est démarré
# Si Docker :
docker-compose up -d

# Si local :
sudo service postgresql start
```

### Erreur : "Prisma Client not generated"
```bash
npx prisma generate
```

### Erreur : "NEXTAUTH_SECRET not set"
```bash
# Générer un secret
openssl rand -base64 32

# Ajouter dans .env
NEXTAUTH_SECRET="votre_secret_généré"
```

### Port 3000 déjà utilisé
```bash
# Changer le port
PORT=3001 npm run dev
```

## 📱 Accès rapide

- **Application** : http://localhost:3000
- **Prisma Studio** : `npm run db:studio` → http://localhost:5555
- **API Docs** : Voir README.md section "API Routes"

## 🎓 Formation utilisateurs

### Rôles
1. **ADMIN** : tous droits (création, modification, suppression)
2. **OPERATEUR** : création mouvements, OF, réceptions
3. **LECTURE** : consultation uniquement

### Workflow typique

1. **Réception de composants**
   - Fournisseurs → Nouvelle facture
   - Ajouter lignes de réception (composant, lot, qty, coût)
   - Le système met à jour automatiquement :
     - Stock au dépôt
     - Coût moyen pondéré

2. **Création d'OF**
   - OF → Nouvel OF
   - Sélectionner produit et quantité
   - Statut : BROUILLON

3. **Sortie vers Pipcos**
   - Mouvements → Sortie vers Pipcos
   - Sélectionner OF et composants
   - Le système vérifie le stock disponible

4. **Déclaration de production**
   - Mouvements → Production fini
   - Indiquer OF et quantité produite
   - Le système consomme les composants chez Pipcos

5. **Transfert vers dépôt**
   - Mouvements → Transfert vers dépôt
   - Le produit fini est disponible au dépôt

6. **Retour excédents**
   - Mouvements → Retour de Pipcos
   - Retourner composants non utilisés

## 💡 Bonnes pratiques

1. **Toujours vérifier les stocks** avant de créer des mouvements
2. **Utiliser des codes uniques** pour les lots
3. **Fermer les OF** une fois la production terminée
4. **Consulter les rapports** régulièrement
5. **Exporter les données** pour analyse externe

## 📞 Support

Pour toute question :
1. Consulter README.md (documentation complète)
2. Consulter DEPLOYMENT.md (guide déploiement)
3. Vérifier les logs : console Next.js
4. Utiliser Prisma Studio pour inspecter la DB

---

**Prêt à démarrer !** 🚀
