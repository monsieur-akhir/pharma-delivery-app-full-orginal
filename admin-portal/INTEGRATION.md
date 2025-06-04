# Integration Backend-Frontend

Ce document explique comment l'application admin-portal (Angular) interagit avec le backend NestJS.

## Architecture d'intégration

L'application s'appuie sur une architecture de services REST pour communiquer avec le backend. Toutes les requêtes API passent par le chemin `/api`, qui est redirigé vers le backend via un proxy de développement.

## Points clés de l'intégration

1. **Proxy de développement** : Configuré dans `proxy.conf.json` pour rediriger les requêtes `/api` vers `http://localhost:3000`
2. **Services API** : Organisés par entité métier dans `src/app/core/services/api/`
3. **Intercepteurs HTTP** : Pour l'authentification et la gestion des erreurs
4. **Modèles de données** : Partagés entre le frontend et le backend pour assurer la cohérence

## Services API disponibles

- `UserService` - Gestion des utilisateurs
- `PharmacyService` - Gestion des pharmacies
- `OrderService` - Gestion des commandes
- `PrescriptionService` - Gestion des ordonnances
- `PaymentService` - Gestion des paiements
- `NotificationService` - Gestion des notifications
- `SupplierOrderService` - Gestion des commandes fournisseurs
- `ReminderService` - Gestion des rappels médicaments
- `StatsService` - Statistiques globales
- `PharmacyStatisticsService` - Statistiques des pharmacies
- `VideoChatService` - Gestion des sessions vidéo
- `ScheduledTaskService` - Gestion des tâches planifiées

## Utilisation des services API

```typescript
import { Component, OnInit } from '@angular/core';
import { UserService } from '../../core/services/api/user.service';
import { User } from '../../core/models/user.model';

@Component({
  selector: 'app-user-list',
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.scss']
})
export class UserListComponent implements OnInit {
  users: User[] = [];
  
  constructor(private userService: UserService) {}
  
  ngOnInit(): void {
    this.userService.getUsers().subscribe(
      response => {
        this.users = response.users;
      },
      error => {
        console.error('Erreur lors du chargement des utilisateurs:', error);
      }
    );
  }
}
```

## Service API centralisé

Pour faciliter l'accès à tous les services API, vous pouvez utiliser le service centralisé `ApiService` :

```typescript
import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  constructor(private api: ApiService) {}
  
  ngOnInit(): void {
    // Utiliser les différents services via l'API centralisée
    this.api.users.getUsers().subscribe(/* ... */);
    this.api.pharmacies.getPharmacies().subscribe(/* ... */);
    this.api.orders.getOrders().subscribe(/* ... */);
  }
}
```
