# Guide de déploiement Bikarpharma SaaS

Ce guide explique comment déployer l'application Bikarpharma SaaS sur différentes plateformes.

## Option 1 : Déploiement sur Vercel (Recommandé)

Vercel offre un support natif pour Next.js et une intégration facile avec PostgreSQL.

### Prérequis
- Compte Vercel (gratuit)
- Compte GitHub

### Étapes

1. **Push du code sur GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin <votre-repo-github>
   git push -u origin main
   ```

2. **Créer une base de données PostgreSQL**
   
   Option A - Vercel Postgres :
   - Créez un nouveau projet sur Vercel
   - Allez dans Storage → Create Database → Postgres
   - Copiez la connexion string

   Option B - Supabase :
   - Créez un projet sur supabase.com
   - Allez dans Settings → Database
   - Copiez la connexion string (mode "Session")

   Option C - Neon.tech :
   - Créez un projet sur neon.tech (gratuit)
   - Copiez la connexion string

3. **Déployer sur Vercel**
   - Connectez-vous à vercel.com
   - Cliquez "Add New Project"
   - Importez votre repo GitHub
   - Configurez les variables d'environnement :
     ```
     DATABASE_URL=votre_connexion_string_postgres
     NEXTAUTH_URL=https://votre-app.vercel.app
     NEXTAUTH_SECRET=générez_avec_openssl_rand_base64_32
     EMAIL_SERVER=smtp://... (optionnel pour les tests)
     EMAIL_FROM=noreply@votre-domaine.com
     ```
   - Cliquez "Deploy"

4. **Initialiser la base de données**
   
   Après le premier déploiement :
   ```bash
   # Clonez le repo localement si pas déjà fait
   # Installez les dépendances
   npm install
   
   # Configurez DATABASE_URL dans .env avec votre string de production
   
   # Appliquez les migrations
   npx prisma db push
   
   # Exécutez le seed
   npx prisma db seed
   ```

5. **Accédez à l'application**
   - Votre app est disponible sur : https://votre-app.vercel.app
   - Connectez-vous avec : admin@bikarpharma.com

## Option 2 : Déploiement sur Railway

Railway offre une solution simple avec PostgreSQL inclus.

### Étapes

1. **Créer un compte sur railway.app**

2. **Créer un nouveau projet**
   - Cliquez "New Project"
   - Sélectionnez "Deploy from GitHub repo"
   - Choisissez votre repo

3. **Ajouter PostgreSQL**
   - Cliquez "New" → "Database" → "Add PostgreSQL"
   - Railway génère automatiquement DATABASE_URL

4. **Configurer les variables d'environnement**
   - Dans votre service Next.js, ajoutez :
     ```
     NEXTAUTH_URL=${{RAILWAY_PUBLIC_DOMAIN}}
     NEXTAUTH_SECRET=<générez avec openssl rand -base64 32>
     EMAIL_SERVER=...
     EMAIL_FROM=...
     ```

5. **Déployer et initialiser**
   - Railway déploie automatiquement
   - Connectez-vous en SSH et exécutez :
     ```bash
     npx prisma db push
     npx prisma db seed
     ```

## Option 3 : Déploiement sur serveur VPS

Pour un serveur Linux (Ubuntu/Debian).

### Prérequis
- Serveur VPS (DigitalOcean, Linode, etc.)
- Node.js 18+
- PostgreSQL 15+
- Nginx (pour reverse proxy)
- Certbot (pour SSL)

### Étapes

1. **Installer les dépendances**
   ```bash
   # Mettez à jour le système
   sudo apt update && sudo apt upgrade -y
   
   # Installez Node.js 18
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt install -y nodejs
   
   # Installez PostgreSQL
   sudo apt install -y postgresql postgresql-contrib
   
   # Installez Nginx
   sudo apt install -y nginx
   
   # Installez PM2 (process manager)
   sudo npm install -g pm2
   ```

2. **Configurer PostgreSQL**
   ```bash
   sudo -u postgres psql
   CREATE DATABASE bikarpharma;
   CREATE USER bikarpharma_user WITH PASSWORD 'votre_mot_de_passe_securise';
   GRANT ALL PRIVILEGES ON DATABASE bikarpharma TO bikarpharma_user;
   \q
   ```

3. **Cloner et configurer l'application**
   ```bash
   cd /var/www
   git clone <votre-repo> bikarpharma-saas
   cd bikarpharma-saas
   
   npm install
   
   # Créez .env
   cat > .env << EOF
   DATABASE_URL="postgresql://bikarpharma_user:votre_mot_de_passe@localhost:5432/bikarpharma?schema=public"
   NEXTAUTH_URL="https://votre-domaine.com"
   NEXTAUTH_SECRET="<générez avec openssl rand -base64 32>"
   EMAIL_SERVER="..."
   EMAIL_FROM="..."
   EOF
   
   # Initialisez la base de données
   npx prisma db push
   npx prisma db seed
   
   # Build l'application
   npm run build
   ```

4. **Configurer PM2**
   ```bash
   pm2 start npm --name "bikarpharma" -- start
   pm2 save
   pm2 startup
   ```

5. **Configurer Nginx**
   ```bash
   sudo nano /etc/nginx/sites-available/bikarpharma
   ```
   
   Ajoutez :
   ```nginx
   server {
       listen 80;
       server_name votre-domaine.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```
   
   Activez le site :
   ```bash
   sudo ln -s /etc/nginx/sites-available/bikarpharma /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

6. **Configurer SSL avec Let's Encrypt**
   ```bash
   sudo apt install -y certbot python3-certbot-nginx
   sudo certbot --nginx -d votre-domaine.com
   ```

## Configuration Email (Production)

Pour l'authentification par email en production, configurez un service SMTP :

### Option A : SendGrid
```env
EMAIL_SERVER=smtp://apikey:votre_api_key@smtp.sendgrid.net:587
EMAIL_FROM=noreply@votre-domaine.com
```

### Option B : AWS SES
```env
EMAIL_SERVER=smtp://votre_username:votre_password@email-smtp.eu-west-1.amazonaws.com:587
EMAIL_FROM=noreply@votre-domaine.com
```

### Option C : Gmail (développement uniquement)
```env
EMAIL_SERVER=smtp://votre.email@gmail.com:votre_app_password@smtp.gmail.com:587
EMAIL_FROM=votre.email@gmail.com
```

## Tests après déploiement

1. **Vérifiez la connexion**
   - Accédez à votre URL
   - Essayez de vous connecter avec admin@bikarpharma.com

2. **Vérifiez les données**
   - Dashboard doit afficher les statistiques
   - Vérifiez que le scénario BICAR200 est présent :
     - 6 composants avec stocks
     - 1 produit BICAR200
     - 1 OF (OF-2025-002) avec statut EN_COURS
     - Stock PF dépôt : 4900

3. **Vérifiez les calculs**
   - Dans Rapports → Stock composants
   - Valeur totale doit correspondre aux calculs

## Maintenance

### Sauvegardes PostgreSQL
```bash
# Sauvegarde
pg_dump -U bikarpharma_user bikarpharma > backup_$(date +%Y%m%d).sql

# Restauration
psql -U bikarpharma_user bikarpharma < backup_20250101.sql
```

### Mises à jour
```bash
cd /var/www/bikarpharma-saas
git pull origin main
npm install
npx prisma db push
npm run build
pm2 restart bikarpharma
```

### Logs
```bash
# PM2 logs
pm2 logs bikarpharma

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

## Support

Pour toute question ou problème de déploiement, consultez :
- Documentation Next.js : https://nextjs.org/docs/deployment
- Documentation Prisma : https://www.prisma.io/docs/guides/deployment
- Documentation NextAuth : https://next-auth.js.org/deployment
