# Système d'Authentification Sécurisée - Pharma Delivery App

Ce document présente l'architecture et l'implémentation du système d'authentification pour l'application Pharma Delivery.

## Architecture Globale

Le système d'authentification est implémenté pour trois interfaces différentes :

1. **Application Web d'Administration** (Angular)
2. **Application Mobile pour Clients** (React Native)
3. **Application Mobile pour Coursiers** (React Native)

## Fonctionnalités Principales

- **Gestion des JWT Tokens**
  - Stockage sécurisé des tokens
  - Analyse et validation de l'expiration
  - Rafraîchissement automatique avant expiration
  - Blacklist de tokens invalidés

- **Authentification Adaptée par Rôle**
  - Admin : Interface web complète
  - Client : Interface mobile limitée aux commandes
  - Coursier : Interface mobile limitée aux livraisons

- **Déconnexion Sécurisée**
  - Invalidation des tokens côté serveur
  - Suppression des données locales côté client
  - Ajout des tokens à une blacklist Redis

## Composants Techniques

### Backend (NestJS)

#### 1. Services d'Authentification

- `AdminAuthService` : Gestion de l'authentification des administrateurs
- `AuthService` : Authentification des utilisateurs mobiles (clients et coursiers)
- `TokenBlacklistService` : Gestion de la liste noire des tokens invalidés

#### 2. Guards de Sécurité

- `JwtAuthGuard` : Validation standard du JWT
- `JwtBlacklistGuard` : Vérification contre la liste noire de tokens

#### 3. Intercepteurs 

- `TokenRefreshInterceptor` : Rafraîchissement automatique des tokens avant expiration

#### 4. Controllers

- `AdminAuthController` : Endpoints d'authentification pour l'interface admin
- `MobileAuthController` : Endpoints d'authentification pour l'app mobile

### Frontend Admin (Angular)

#### 1. Services

- `AuthService` : Gestion des tokens, vérification d'expiration, auto-logout
- Méthodes de gestion du profil et des autorisations

#### 2. Intercepteurs

- `TokenInterceptor` : Ajout du token aux requêtes sortantes, gestion du rafraîchissement
- `AuthInterceptor` : Gestion des erreurs 401/403 et redirection

### Applications Mobiles (React Native)

#### 1. Services

- `AuthService` : Gestion des tokens, authentification par rôle
- `OrderService` : Fonctionnalités pour les clients
- `DeliveryService` : Fonctionnalités pour les coursiers

#### 2. État Global

- Redux pour la gestion de l'état d'authentification
- Stockage persistant via AsyncStorage

## Flux d'Authentification

### 1. Connexion

```
Client → Authentification → Réception du token → Stockage local et Redux → Configuration du timer de rafraîchissement
```

### 2. Utilisation

```
Client → Requête avec token → Backend vérifie validité + blacklist → Réponse → (Optionnel: token rafraîchi)
```

### 3. Rafraîchissement

```
Timer expire → Demande de rafraîchissement → Backend invalide ancien token → Génère nouveau token → Client met à jour stockage
```

### 4. Déconnexion

```
Client demande déconnexion → Backend ajoute token à blacklist → Client supprime données locales
```

## Implémentation de la Sécurité des Tokens

- Stockage des tokens dans Redis avec TTL automatique
- Hachage des tokens dans la blacklist pour éviter les fuites
- Vérification de validité à chaque requête
- Double vérification côté client et serveur de l'expiration

## Roadmap et Améliorations

- **Court terme**
  - Tests unitaires et d'intégration
  - Monitoring des tentatives d'utilisation de tokens invalides

- **Moyen terme**
  - Implémentation de refresh tokens de longue durée
  - Authentification biométrique sur mobile

- **Long terme**
  - Support OAuth2 et OpenID Connect pour authentification tierce
  - Audit complet de sécurité et tests de pénétration
