# MediConnect - Plateforme de Gestion de Médicaments Mobile

MediConnect est une plateforme complète de gestion de médicaments qui connecte les patients, les pharmacies et les prestataires de soins de santé grâce à une technologie intelligente.

## Fonctionnalités principales

- **Commande de médicaments** : Recherchez et commandez des médicaments auprès des pharmacies à proximité.
- **Analyse de prescriptions par IA** : Téléchargez et analysez des prescriptions à l'aide d'une technologie d'IA avancée.
- **Consultation vidéo en temps réel** : Connectez-vous avec des pharmaciens pour des conseils personnalisés.
- **Suivi des livraisons** : Suivez votre livraison de médicaments en temps réel grâce à la géolocalisation.
- **Paiements sécurisés** : Options de paiement multiples, y compris Stripe et Mobile Money pour le marché africain.
- **Rappels de médicaments** : Définissez des rappels avec des animations interactives pour l'observance des médicaments.
- **Portail administratif** : Gestion complète des pharmacies, des utilisateurs et des paramètres d'IA.

## Architecture

Le projet est structuré en trois composants principaux :

1. **Backend (NestJS)** : API RESTful et services WebSocket pour le traitement des données et la logique métier.
2. **Application Mobile (React Native)** : Interface utilisateur mobile pour les patients et les livreurs.
3. **Portail Administratif (Angular)** : Interface utilisateur web pour les administrateurs et les pharmaciens.

## Prérequis

- Node.js (v20 ou supérieur)
- Docker et Docker Compose
- PostgreSQL
- Redis

## Installation

### Avec Docker

1. Clonez le dépôt :
   ```bash
   git clone https://github.com/votre-organisation/medconnect.git
   cd medconnect
   ```

2. Configurez les variables d'environnement :
   ```bash
   cp .env.example .env
   # Modifiez le fichier .env avec vos propres clés API
   ```

3. Démarrez l'application avec Docker Compose :
   ```bash
   ./scripts/setup-local-env.sh
   ```

4. Accédez à l'application :
   - Backend API : http://localhost:8000
   - Portail Administratif : http://localhost:4200
   - Aperçu de l'Application Mobile : http://localhost:5000
   - Console Minio : http://localhost:9001

### Installation manuelle

1. Clonez le dépôt :
   ```bash
   git clone https://github.com/votre-organisation/medconnect.git
   cd medconnect
   ```

2. Installez les dépendances du backend et démarrez le serveur :
   ```bash
   cd backend
   npm install
   npm run start:dev
   ```

3. Installez les dépendances du portail administratif et démarrez le serveur :
   ```bash
   cd admin-portal
   npm install
   npm start
   ```

4. Installez les dépendances de l'application mobile et démarrez le serveur :
   ```bash
   cd mobile-app
   npm install
   npm start
   ```

## Authentification

Le système utilise une authentification à deux facteurs pour le portail administratif :
1. Entrée du nom d'utilisateur
2. Vérification par code OTP envoyé par email et/ou SMS

Pour l'application mobile, l'authentification peut se faire par :
- Numéro de téléphone
- Nom d'utilisateur
- Email

## Configuration des services externes

### Brevo (pour les notifications par email et SMS)
- Configurez les variables `BREVO_API_KEY_MAIL` et `BREVO_API_KEY_SMS` dans le fichier `.env`

### Stripe (pour les paiements)
- Configurez les variables `STRIPE_SECRET_KEY` et `STRIPE_PUBLISHABLE_KEY` dans le fichier `.env`

### OpenAI (pour l'analyse des prescriptions)
- Configurez la variable `OPENAI_API_KEY` dans le fichier `.env`

## Structure du projet

```
├── admin-portal/          # Portail administratif Angular
├── backend/               # API NestJS et logique métier
├── mobile-app/            # Application mobile React Native
├── scripts/               # Scripts utilitaires
├── shared/                # Code partagé entre les composants
├── docker-compose.yml     # Configuration Docker Compose
└── README.md              # Documentation du projet
```

## Pipeline CI/CD

Le projet utilise GitHub Actions et/ou GitLab CI pour l'intégration continue et le déploiement continu. Les pipelines configurés comprennent :
- Tests automatisés
- Construction des artefacts
- Déploiement sur les environnements de staging et de production

## Contribution

1. Créez une branche à partir de `develop`
2. Effectuez vos modifications
3. Soumettez une pull request vers `develop`

## Licence

Ce projet est sous licence [MIT](LICENSE).

## Support

Pour toute question ou assistance, veuillez contacter l'équipe de développement à support@medconnect.example.com