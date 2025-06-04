import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatBadgeModule } from '@angular/material/badge';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { FuturisticLoaderComponent } from '../../shared/components/futuristic-loader/futuristic-loader.component';
import { LocationService } from '../../core/services/api/location.service';
import { OrderService } from '../../core/services/api/order.service';
import { ErrorHandlerService } from '../../core/services/error-handler.service';
import { Subscription, interval, EMPTY, of } from 'rxjs';
import { switchMap, catchError, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { LocationPoint, ETAInfo } from '../../core/models/location.model';

declare const L: any; // Leaflet

// Interface pour l'objet delivery (à affiner selon le modèle Order réel)
interface Delivery {
  id: string; // ou number
  status: string;
  delivery_person_id?: number;
  deliveryPerson?: string; // Nom du livreur
  destination_latitude?: number;
  destination_longitude?: number;
  customer_name?: string;
  delivery_address?: string;
  // ... autres champs pertinents
}

@Component({
  selector: 'app-delivery-tracking',
  standalone: true,
  imports: [
    CommonModule,
    MatTabsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatBadgeModule,
    MatProgressBarModule,
    MatSelectModule,
    MatInputModule,
    FormsModule,
    ReactiveFormsModule,
    MatTooltipModule,
    MatChipsModule,
    FuturisticLoaderComponent
  ],
  templateUrl: './delivery-tracking.component.html', // Assumant un fichier HTML séparé
  styleUrls: ['./delivery-tracking.component.scss'] // Assumant un fichier SCSS séparé
})
export class DeliveryTrackingComponent implements OnInit, OnDestroy, AfterViewInit {
  [x: string]: any;
  @ViewChild('map') mapElement!: ElementRef;
  @ViewChild('activeDeliveriesPaginator') activeDeliveriesPaginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  // Ajoutez d'autres ViewChild pour les paginators/sorts des autres tables si nécessaire

  isLoading = false;
  selectedTabIndex = 0;

  // Données pour les tables
  activeDeliveriesDataSource = new MatTableDataSource<Delivery>();
  completedDeliveriesDataSource = new MatTableDataSource<Delivery>();
  pendingDeliveriesDataSource = new MatTableDataSource<Delivery>();
  deliveryIssuesDataSource = new MatTableDataSource<Delivery>();
  
  displayedColumns: string[] = ['id', 'customer_name', 'status', 'deliveryPerson', 'actions']; // Exemple

  selectedDelivery: Delivery | null = null;
  currentLocation: LocationPoint | null = null;
  locationHistory: LocationPoint[] = [];
  etaInfo: ETAInfo | null = null;

  private map: any; // L.Map
  private deliveryMarker: any; // L.Marker
  private pathPolyline: any; // L.Polyline
  private historyMarkers: any[] = []; // L.CircleMarker[] or L.Polyline[]

  searchControl = new FormControl('');
  statusFilterControl = new FormControl('');

  private subscriptions = new Subscription();
  private locationUpdateSubscription?: Subscription; // Pour le polling de la localisation
  private readonly POLLING_INTERVAL = 30000; // 30 secondes

  private logger = {
    log: (message: string, ...optionalParams: any[]) => console.log(`[DeliveryTrackingComponent] ${message}`, ...optionalParams),
    warn: (message: string, ...optionalParams: any[]) => console.warn(`[DeliveryTrackingComponent] ${message}`, ...optionalParams),
    error: (message: string, ...optionalParams: any[]) => console.error(`[DeliveryTrackingComponent] ${message}`, ...optionalParams),
  };
  
  deliveryStats: any = null; // À typer correctement

  constructor(
    private locationService: LocationService,
    private orderService: OrderService,
    private errorHandler: ErrorHandlerService
  ) {}

  ngOnInit(): void {
    this.loadActiveDeliveries();
    this.loadDeliveryStats();

    // Filtrage pour la recherche
    this.subscriptions.add(
      this.searchControl.valueChanges.pipe(
        debounceTime(300),
        distinctUntilChanged()
      ).subscribe(value => {
        this.applyFilter(value || '');
      })
    );

    // Filtrage par statut
    this.subscriptions.add(
      this.statusFilterControl.valueChanges.subscribe(status => {
        this.loadActiveDeliveries(1, this.activeDeliveriesPaginator?.pageSize || 10, status || undefined, this.searchControl.value || undefined);
      })
    );
  }

  ngAfterViewInit(): void {
    this.activeDeliveriesDataSource.paginator = this.activeDeliveriesPaginator;
    this.activeDeliveriesDataSource.sort = this.sort;
    // Configurer les paginators et sorts pour les autres tables ici
    
    // Initialiser la carte si une livraison est déjà sélectionnée (par exemple, via un paramètre d'URL)
    // if (this.selectedDelivery && this.mapElement) {
    //   this.initMap();
    // }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    if (this.locationUpdateSubscription) {
      this.locationUpdateSubscription.unsubscribe();
    }
    if (this.map) {
      this.map.remove(); // Nettoyer la carte Leaflet
    }
  }

  initMap(): void {
    if (!this.mapElement?.nativeElement) {
      this.logger.warn('Map element not found.');
      return;
    }
    if (!this.selectedDelivery) {
      this.logger.warn('Cannot initialize map: No delivery selected.');
      return;
    }
    if (!this.currentLocation) {
      this.logger.warn('Cannot initialize map: Current location not available for selected delivery.');
      // Peut-être essayer de charger la localisation ici si selectedDelivery.id existe
      if(this.selectedDelivery.id) {
        this.loadCurrentLocation(this.selectedDelivery.id.toString(), true); // true pour initMap après chargement
        return;
      }
      return;
    }

    if (this.map) {
      this.map.setView([this.currentLocation.latitude, this.currentLocation.longitude], 15);
      this.updateMapMarker();
      return;
    }

    this.map = L.map(this.mapElement.nativeElement).setView([this.currentLocation.latitude, this.currentLocation.longitude], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(this.map);
    
    this.logger.log('Map initialized.');
    this.updateMapMarker();
  }

  loadCurrentLocation(deliveryId: string, shouldInitMapAfterLoad: boolean = false): void {
    if (!deliveryId) return;

    this.subscriptions.add(
      this.locationService.getCurrentLocation(deliveryId).pipe(
        catchError(error => {
          this.errorHandler.handleError(error);
          this.currentLocation = null; // Réinitialiser en cas d'erreur
          return EMPTY; 
        })
      ).subscribe((location: LocationPoint | null) => { // Attendre LocationPoint ou null
        if (location) {
          this.currentLocation = location;
          if (this.selectedDelivery && this.selectedDelivery.id === deliveryId) {
            if (!this.map && shouldInitMapAfterLoad) {
              this.initMap();
            } else if (this.map) {
              this.map.setView([location.latitude, location.longitude], this.map.getZoom() || 15);
              this.updateMapMarker();
              this.updatePathLine(); 
            }
            this.updateETA(deliveryId);
          }
        } else {
            this.currentLocation = null;
            this.logger.warn(`No current location found for delivery ${deliveryId}.`);
        }
      })
    );
  }

  updateMapMarker(): void {
    if (!this.map || !this.currentLocation) {
      // this.logger.warn('Cannot update map marker: Map or current location not available.');
      return;
    }

    const latLng = L.latLng(this.currentLocation.latitude, this.currentLocation.longitude);
    const iconUrl = this.selectedDelivery?.status === 'delivered' ? 'assets/icons/marker-delivered.png' : 'assets/icons/delivery-marker.png';
    const deliveryIcon = L.icon({
      iconUrl: iconUrl, // S'assurer que ces icônes existent
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32]
    });

    if (this.deliveryMarker) {
      this.deliveryMarker.setLatLng(latLng).setIcon(deliveryIcon);
    } else {
      this.deliveryMarker = L.marker(latLng, { icon: deliveryIcon }).addTo(this.map);
    }
    // this.map.setView(latLng, this.map.getZoom()); // Peut causer des sauts si l'utilisateur a zoomé/dézoomé

    const popupContent = `
      <b>Livraison ID:</b> ${this.selectedDelivery?.id}<br>
      <b>Statut:</b> ${this['getStatusLabel'](this.selectedDelivery?.status || '')}<br>
      <b>Livreur:</b> ${this.selectedDelivery?.deliveryPerson || 'N/A'}<br>
      <b>Client:</b> ${this.selectedDelivery?.customer_name || 'N/A'}<br>
      <b>Heure:</b> ${new Date(this.currentLocation.timestamp).toLocaleTimeString()}
    `;
    this.deliveryMarker.bindPopup(popupContent);
  }
  
  updateETA(deliveryId: string): void {
    if (!this.selectedDelivery || !this.selectedDelivery.destination_latitude || !this.selectedDelivery.destination_longitude) {
      this.etaInfo = null;
      return;
    }
    this.subscriptions.add(
      this.locationService.getETA(
        deliveryId,
        this.selectedDelivery.destination_latitude,
        this.selectedDelivery.destination_longitude
      ).pipe(
        catchError(error => {
          this.errorHandler.handleError(error);
          this.etaInfo = null;
          return of(null); // Retourner un observable de null
        })
      ).subscribe((eta: ETAInfo | null) => {
        this.etaInfo = eta;
      })
    );
  }

  updatePathLine(): void {
    if (!this.map) return;

    const historyPointsToDraw = this.locationHistory.filter(p => p.latitude && p.longitude);

    if (historyPointsToDraw.length < 1 && !this.currentLocation) {
        if (this.pathPolyline) {
            this.map.removeLayer(this.pathPolyline);
            this.pathPolyline = null;
        }
        return;
    }

    const latLngs: any[] = historyPointsToDraw.map(p => [p.latitude, p.longitude]);
    
    if (this.currentLocation) {
        latLngs.push([this.currentLocation.latitude, this.currentLocation.longitude]);
    }
    
    if (latLngs.length < 2 && this.pathPolyline){ // Clear polyline if not enough points
        this.map.removeLayer(this.pathPolyline);
        this.pathPolyline = null;
        return;
    }
    
    if (latLngs.length >=2) {
        if (this.pathPolyline) {
        this.pathPolyline.setLatLngs(latLngs);
        } else {
        this.pathPolyline = L.polyline(latLngs, { color: 'blue', weight: 3, opacity: 0.7 }).addTo(this.map);
        }
    }
  }

  onSelectDelivery(delivery: Delivery): void {
    this.logger.log('Delivery selected:', delivery);
    this.selectedDelivery = delivery;
    this.currentLocation = null;
    this.locationHistory = [];
    this.etaInfo = null;

    // Arrêter le polling précédent
    if (this.locationUpdateSubscription) {
      this.locationUpdateSubscription.unsubscribe();
    }

    // Nettoyer la carte
    if (this.map) {
      this.historyMarkers.forEach(marker => this.map.removeLayer(marker));
      this.historyMarkers = [];
      if (this.pathPolyline) {
        this.map.removeLayer(this.pathPolyline);
        this.pathPolyline = null;
      }
      if (this.deliveryMarker) {
        this.map.removeLayer(this.deliveryMarker);
        this.deliveryMarker = null;
      }
    }

    if (delivery && delivery.id) {
      this.loadCurrentLocation(delivery.id.toString(), true); // true pour initMap après chargement
      // Démarrer le polling pour la localisation actuelle
      this.locationUpdateSubscription = interval(this.POLLING_INTERVAL)
        .pipe(
          switchMap(() => this.locationService.getCurrentLocation(delivery.id.toString()).pipe(
            catchError(err => {
              this.errorHandler.handleError(err);
              // Si l'erreur est 404 (pas de localisation), on peut vouloir arrêter le polling ou juste ignorer
              if (err.status === 404) {
                this.logger.warn(`Location not found for delivery ${delivery.id} during polling.`);
                this.currentLocation = null; // Effacer la localisation si elle n'est plus trouvée
                if (this.deliveryMarker && this.map) { // Enlever le marqueur si la localisation n'est plus dispo
                    this.map.removeLayer(this.deliveryMarker);
                    this.deliveryMarker = null;
                }
              }
              return EMPTY;
            })
          ))
        )
        .subscribe((location: LocationPoint | null) => {
          if (location) {
            this.currentLocation = location;
            if (this.map) { // S'assurer que la carte existe
              this.map.setView([location.latitude, location.longitude], this.map.getZoom() || 15);
              this.updateMapMarker();
              this.updatePathLine(); // Mettre à jour le tracé avec la nouvelle position
            } else {
                // Si la carte n'est pas initialisée (cas rare ici, mais pour être sûr)
                this.initMap();
            }
            this.updateETA(delivery.id.toString());
          }
        });
      this.subscriptions.add(this.locationUpdateSubscription);
    } else {
      // Si aucune livraison n'est sélectionnée, ou si l'ID est manquant
      if (this.map && this.mapElement?.nativeElement) {
         // Optionnel: cacher la carte ou afficher un état vide
         // this.mapElement.nativeElement.style.display = 'none';
      }
    }
  }

  toggleHistory(): void {
    if (!this.map || !this.selectedDelivery?.id) return;

    const historyCurrentlyVisible = this.historyMarkers.length > 0;

    if (historyCurrentlyVisible) {
      this.historyMarkers.forEach(marker => this.map.removeLayer(marker));
      this.historyMarkers = [];
      if (this.pathPolyline) { // Optionnel: garder le tracé principal ou le supprimer aussi
        // this.map.removeLayer(this.pathPolyline);
        // this.pathPolyline = null;
      }
      this.logger.log('Location history hidden.');
      return;
    }
    
    this.isLoading = true;
    this.subscriptions.add(
      this.locationService.getLocationHistory(this.selectedDelivery.id.toString()).pipe(
        catchError(error => {
          this.errorHandler.handleError(error);
          this.isLoading = false;
          return EMPTY;
        })
      ).subscribe((history: LocationPoint[]) => {
        this.isLoading = false;
        this.locationHistory = history || [];
        
        this.historyMarkers.forEach(marker => this.map.removeLayer(marker)); // Clear previous if any (safety)
        this.historyMarkers = [];
        
        if (this.locationHistory.length > 0) {
          // const historyPointsForPath: Array<[number, number]> = []; // Not strictly needed if updatePathLine uses this.locationHistory
          
          this.locationHistory.forEach((point: LocationPoint) => {
            if (point.latitude && point.longitude) {
              const marker = L.circleMarker([point.latitude, point.longitude], {
                radius: 5, fillColor: '#6c757d', color: '#343a40', weight: 1, opacity: 1, fillOpacity: 0.7
              }).addTo(this.map);
              
              const timestamp = new Date(point.timestamp).toLocaleString();
              marker.bindPopup(`<b>Point Historique</b><br>Heure: ${timestamp}<br>Lat: ${point.latitude.toFixed(4)}, Lng: ${point.longitude.toFixed(4)}`);
              
              // historyPointsForPath.push([point.latitude, point.longitude]); // Not strictly needed
              this.historyMarkers.push(marker);
            }
          });
          this.logger.log(`Location history loaded with ${this.locationHistory.length} points.`);
        } else {
          this.logger.log('No location history found.');
        }
        this.updatePathLine(); // Mettre à jour le tracé avec l'historique complet
      })
    );
  }

  // Méthodes pour charger les données des tables (exemples à implémenter)
  loadActiveDeliveries(page: number = 1, limit: number = 10, status?: string, query?: string): void {
    this.isLoading = true;
    this.subscriptions.add(
      this.orderService.getActiveDeliveries(page, limit, status, query).pipe(
        catchError(err => {
          this.errorHandler.handleError(err);
          this.isLoading = false;
          return of({ data: [], total: 0, currentPage: 1, totalPages: 1 }); // Structure attendue par MatTableDataSource et pagination
        })
      ).subscribe(response => {
        this.isLoading = false;
        this.activeDeliveriesDataSource.data = response.data;
        // Gérer la pagination côté serveur si nécessaire
        if (this.activeDeliveriesPaginator) {
            this.activeDeliveriesPaginator.length = response.total;
            this.activeDeliveriesPaginator.pageIndex = response.currentPage - 1;
        }
        if (!this.selectedDelivery && response.data.length > 0) {
            // Optionnel: sélectionner la première livraison par défaut
            // this.onSelectDelivery(response.data[0]);
        }
      })
    );
  }

  loadCompletedDeliveries(page: number = 1, limit: number = 10, query?: string): void { 
    this.isLoading = true;
    this.subscriptions.add(
      this.orderService.getCompletedDeliveries(page, limit).pipe(
        catchError(err => {
          this.errorHandler.handleError(err);
          this.isLoading = false;
          return of({ data: [], total: 0, currentPage: 1, totalPages: 1 });
        })
      ).subscribe(response => {
        this.isLoading = false;
        this.completedDeliveriesDataSource.data = response.data;
        // Gérer la pagination
      })
    );
  }
  loadPendingDeliveries(page: number = 1, limit: number = 10, query?: string): void {
    this.isLoading = true;
    this.subscriptions.add(
      this.orderService.getPendingDeliveries(page, limit).pipe(
        catchError(err => {
          this.errorHandler.handleError(err);
          this.isLoading = false;
          return of({ data: [], total: 0, currentPage: 1, totalPages: 1 });
        })
      ).subscribe(response => {
        this.isLoading = false;
        this.pendingDeliveriesDataSource.data = response.data;
        // Gérer la pagination
      })
    );
  }
  loadDeliveryIssues(page: number = 1, limit: number = 10, query?: string): void {
    this.isLoading = true;
    this.subscriptions.add(
      this.orderService.getDeliveryIssues(page, limit).pipe(
        catchError(err => {
          this.errorHandler.handleError(err);
          this.isLoading = false;
          return of({ data: [], total: 0, currentPage: 1, totalPages: 1 });
        })
      ).subscribe(response => {
        this.isLoading = false;
        this.deliveryIssuesDataSource.data = response.data;
        // Gérer la pagination
      })
    );
  }
  
  loadDeliveryStats(): void {
    this.subscriptions.add(
      this.orderService.getDeliveryAnalytics().pipe( // Assurez-vous que cette méthode existe et retourne les bonnes données
        catchError(err => {
          this.errorHandler.handleError(err);
          return of(null);
        })
      ).subscribe(stats => {
        this.deliveryStats = stats;
      })
    );
  }

  applyFilter(filterValue: string): void {
    const query = filterValue.trim().toLowerCase();
    // Appliquer le filtre à la table actuellement visible
    switch (this.selectedTabIndex) {
        case 0: 
            this.loadActiveDeliveries(1, this.activeDeliveriesPaginator?.pageSize || 10, this.statusFilterControl.value || undefined, query);
            break;
        case 1:
            this.loadPendingDeliveries(1, /* pageSize for pending */ 10, query);
            break;
        case 2:
            this.loadCompletedDeliveries(1, /* pageSize for completed */ 10, query);
            break;
        case 3:
            this.loadDeliveryIssues(1, /* pageSize for issues */ 10, query);
            break;
    }
  }
  
  clearSearch(): void {
    this.searchControl.setValue('');
    // this.applyFilter(''); // Déjà géré par valueChanges
  }

  onTabChange(event: any): void { // MatTabChangeEvent
    this.selectedTabIndex = event.index;
    this.selectedDelivery = null; 
    if (this.locationUpdateSubscription) this.locationUpdateSubscription.unsubscribe();
    
    // Réinitialiser la recherche et le filtre de statut lors du changement d'onglet
    this.searchControl.setValue('', { emitEvent: false }); // emitEvent: false pour éviter de recharger via valueChanges
    this.statusFilterControl.setValue('', { emitEvent: false });


    // Nettoyer la carte
    if (this.map) {
      this.historyMarkers.forEach(marker => this.map.removeLayer(marker));
      this.historyMarkers = [];
      if (this.pathPolyline) {
        this.map.removeLayer(this.pathPolyline);
        this.pathPolyline = null;
      }
      if (this.deliveryMarker) {
        this.map.removeLayer(this.deliveryMarker);
        this.deliveryMarker = null;
      }
      // Optionnel: cacher ou réinitialiser la vue de la carte
      if (this.mapElement?.nativeElement) {
        // this.mapElement.nativeElement.style.display = 'none'; // Ou une autre logique
      }
    }
    this.currentLocation = null;
    this.etaInfo = null;


    // Charger les données pour le nouvel onglet
    const paginator = this.getPaginatorForTab(this.selectedTabIndex);
    const pageSize = paginator?.pageSize || 10;

    switch (this.selectedTabIndex) {
      case 0: this.loadActiveDeliveries(1, pageSize); break;
      case 1: this.loadPendingDeliveries(1, pageSize); break;
      case 2: this.loadCompletedDeliveries(1, pageSize); break;
      case 3: this.loadDeliveryIssues(1, pageSize); break;
    }
  }

  private getPaginatorForTab(tabIndex: number): MatPaginator | undefined {
    // TODO: Implement logic to return the correct paginator based on tabIndex
    // This requires having @ViewChild references for each paginator
    if (tabIndex === 0) return this.activeDeliveriesPaginator;
    // if (tabIndex === 1) return this.pendingDeliveriesPaginator; 
    // etc.
    return undefined;
  }

  centerMap(): void {
    if (!this.map) return;
    if (this.deliveryMarker) {
      this.map.setView(this.deliveryMarker.getLatLng(), 15);
    } else if (this.currentLocation) {
      this.map.setView([this.currentLocation.latitude, this.currentLocation.longitude], 15);
    }
  }
  
  refreshLocation(): void {
    if (!this.selectedDelivery?.id) return;
    this.loadCurrentLocation(this.selectedDelivery.id.toString());
    this.updateETA(this.selectedDelivery.id.toString());
    if (this.historyMarkers.length > 0) { // Si l'historique est affiché, le rafraîchir aussi
        // Pour rafraîchir l'historique, il faut le recharger
        this.isLoading = true;
        this.subscriptions.add(
          this.locationService.getLocationHistory(this.selectedDelivery.id.toString()).pipe(
            catchError(error => {
              this.errorHandler.handleError(error);
              this.isLoading = false;
              return EMPTY;
            })
          ).subscribe((history: LocationPoint[]) => {
            this.isLoading = false;
            this.locationHistory = history || [];
            this.historyMarkers.forEach(marker => this.map.removeLayer(marker));
            this.historyMarkers = [];
            if (this.locationHistory.length > 0) {
              this.locationHistory.forEach((point: LocationPoint) => {
                if (point.latitude && point.longitude) {
                  const marker = L.circleMarker([point.latitude, point.longitude], {
                    radius: 5, fillColor: '#6c757d', color: '#343a40', weight: 1, opacity: 1, fillOpacity: 0.7
                  }).addTo(this.map);
                  const timestamp = new Date(point.timestamp).toLocaleString();
                  marker.bindPopup(`<b>Point Historique</b><br>Heure: ${timestamp}<br>Lat: ${point.latitude.toFixed(4)}, Lng: ${point.longitude.toFixed(4)}`);
                  this.historyMarkers.push(marker);
                }
              });
            }
            this.updatePathLine();
          })
        );
    }
  }
  
  assignDelivery(delivery: Delivery): void {
    this.logger.log('Assigner la livraison:', delivery);
    // Implémenter la logique d'assignation (par exemple, ouvrir une modale)
  }

  getStatusLabel(status: string): string {
    if (!status) return 'N/A';
    switch (status.toLowerCase()) {
      case 'pending': return 'En attente';
      case 'assigned': return 'Assignée';
      case 'in_transit':
      case 'in-transit':
        return 'En transit';
      case 'delivered': return 'Livrée';
      case 'cancelled': return 'Annulée';
      case 'failed': return 'Échec de livraison';
      case 'delayed': return 'Retardée';
      default: 
        const formattedStatus = status.replace(/_/g, ' ');
        return formattedStatus.charAt(0).toUpperCase() + formattedStatus.slice(1);
    }
  }
  
  getTimeAgo(timestamp: number | string | Date): string {
    if (timestamp === null || timestamp === undefined) return 'N/A';

    let timeValue: number;
    if (typeof timestamp === 'string') {
      timeValue = new Date(timestamp).getTime();
    } else if (typeof timestamp === 'number') {
      timeValue = timestamp;
    } else if (timestamp instanceof Date) {
      timeValue = timestamp.getTime();
    } else {
      return 'Type de date invalide'; // Should not happen with TypeScript but good for robustness
    }

    if (isNaN(timeValue)) return 'Date invalide';

    const seconds = Math.floor((Date.now() - timeValue) / 1000);

    if (seconds < 0) return 'Dans le futur'; 
    if (seconds < 5) return 'À l\'instant';
    if (seconds < 60) return `Il y a ${seconds} secondes`;

    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `Il y a ${minutes} minute${minutes > 1 ? 's' : ''}`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `Il y a ${hours} heure${hours > 1 ? 's' : ''}`;

    const days = Math.floor(hours / 24);
    return `Il y a ${days} jour${days > 1 ? 's' : ''}`;
  }
}