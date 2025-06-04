import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

export interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  phoneNumber?: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  lastLogin?: string;
  isActive: boolean;
  token?: string;
  name?: string; // Ajout pour compatibilité avec le template
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  
  currentUser$ = this.currentUserSubject.asObservable();
  
  get currentUser(): User | null {
    return this.currentUserSubject.value;
  }
  
  get isLoggedIn(): boolean {
    return !!this.currentUserSubject.value;
  }
  
  /**
   * Updates the current user data in memory and local storage
   * This allows keeping the UI in sync with profile changes
   */
  updateUserData(user: User): void {
    if (!user) return;
    
    // Update local storage
    if (this.currentUser) {
      // Keep existing token if present
      user.token = this.currentUser.token;
      localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    }
    
    // Update the observable
    this.currentUserSubject.next(user);
    
    console.log('User data updated in auth service', user);
  }

  private readonly TOKEN_KEY = 'auth_token';
  private readonly USER_KEY = 'currentUser';
  private tokenExpirationTimer: any;
  
  constructor(private http: HttpClient) {
    this.loadUserFromStorage();
  }
  
  private loadUserFromStorage(): void {
    const userJson = localStorage.getItem(this.USER_KEY);
    const token = localStorage.getItem(this.TOKEN_KEY);
    
    if (userJson && token) {
      try {
        const user = JSON.parse(userJson);
        // Vérifier si le token est expiré
        if (this.isTokenExpired(token)) {
          this.clearAuthData();
          return;
        }
        
        // Si le token est valide, initialiser l'observateur d'utilisateur
        this.currentUserSubject.next(user);
        
        // Configurer l'expiration automatique
        this.setAutoLogout(token);
      } catch (error) {
        console.error('Error parsing user from localStorage:', error);
        this.clearAuthData();
      }
    }
  }

  // Méthode pour vérifier si un token JWT est expiré
  private isTokenExpired(token: string): boolean {
    try {
      // Décodage sécurisé du payload JWT
      const parts = token.split('.');
      if (parts.length !== 3) {
        console.warn('Format de token invalide');
        return true;
      }

      const payload = JSON.parse(atob(parts[1]));
      const expiryTime = payload.exp * 1000; // Convertir en millisecondes
      
      // Ajouter une marge de tolérance de 5 secondes
      const now = Date.now() - 5000; // 5 secondes de marge
      
      const isExpired = now > expiryTime;
      if (isExpired) {
        console.log(`Token expiré à ${new Date(expiryTime).toISOString()}, heure actuelle: ${new Date().toISOString()}`);
      }
      return isExpired;
    } catch (e) {
      console.error('Erreur lors de la vérification de l\'expiration du token:', e);
      // En cas d'erreur de décodage, ne pas considérer automatiquement comme expiré
      // pour éviter les déconnexions inutiles
      return false;
    }
  }

  // Configurer l'expiration automatique du token
  private setAutoLogout(token: string): void {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expiryTime = payload.exp * 1000; // Convertir en millisecondes
      const timeToExpiry = expiryTime - Date.now();
      
      if (timeToExpiry > 0) {
        // Nettoyer tout timer existant
        this.clearExpirationTimer();
        
        // Configurer un nouveau timer pour la déconnexion automatique
        this.tokenExpirationTimer = setTimeout(() => {
          console.log('Token expiré - Déconnexion automatique');
          this.logout();
        }, timeToExpiry);
      } else {
        // Le token est déjà expiré
        this.clearAuthData();
      }
    } catch (e) {
      console.error('Erreur lors de la configuration de l\'expiration automatique:', e);
    }
  }

  // Nettoyer le timer d'expiration
  private clearExpirationTimer(): void {
    if (this.tokenExpirationTimer) {
      clearTimeout(this.tokenExpirationTimer);
      this.tokenExpirationTimer = null;
    }
  }
  
  // Nettoyer toutes les données d'authentification
  private clearAuthData(): void {
    localStorage.removeItem(this.USER_KEY);
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem('temp_username');
    this.currentUserSubject.next(null);
    this.clearExpirationTimer();
  }
  
  login(credentials: { identifier: string; password: string; }): Observable<{ success: boolean; message: string; username?: string }> {
    console.log('Tentative de connexion avec:', { identifier: credentials.identifier });
    
    return this.http.post<{ success: boolean; message: string; username?: string }>('/api/v1/admin/auth/login', credentials)
      .pipe(
        tap(response => {
          console.log('Réponse de connexion étape 1 réussie:', response);
          // Ne pas stocker l'utilisateur ici, seulement après vérification OTP
          // Stockage temporaire du username pour l'étape de vérification OTP
          if (response.username) {
            localStorage.setItem('temp_username', response.username);
          }
        }),
        catchError(error => {
          console.error('Erreur de connexion:', error);
          console.error('Détails:', {
            status: error.status,
            statusText: error.statusText,
            message: error.error?.message || 'Erreur de connexion inconnue',
            url: error.url,
            name: error.name
          });
          throw error;
        })
      );
  }
  
  logout(source: string = 'manual'): void {
    // Ajouter un log pour identifier la source de la déconnexion
    console.log(`Déconnexion initiée depuis: ${source}`, new Error().stack);
    
    // Récupérer le token pour l'inclure dans la requête
    const token = localStorage.getItem(this.TOKEN_KEY);
    
    this.http.post('/api/v1/admin/auth/logout', { source }, {
      headers: token ? { 'Authorization': `Bearer ${token}` } : {}
    }).subscribe({
      next: () => {
        console.log(`Déconnexion réussie côté serveur (source: ${source})`);
        this.clearAuthData();
      },
      error: (error) => {
        console.error(`Erreur lors de la déconnexion (source: ${source}):`, error);
        // Nettoyer quand même les données d'auth même si l'appel API échoue
        this.clearAuthData();
      }
    });
  }
  
  requestPasswordReset(identifier: string): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>('/api/v1/admin/auth/request-password-reset', { identifier });
  }
  
  verifyPasswordReset(data: { identifier: string; resetCode: string; newPassword: string; confirmPassword?: string }): Observable<{ success: boolean; message: string }> {
    // Créer une nouvelle structure pour correspondre à ce que l'API backend attend
    const payload = {
      identifier: data.identifier,
      resetCode: data.resetCode,     // Utilise resetCode comme sur le backend
      newPassword: data.newPassword,
      confirmPassword: data.confirmPassword || data.newPassword // Ajouter confirmPassword si non fourni
    };
    
    console.log('Envoi de la demande de réinitialisation de mot de passe:', { 
      identifier: payload.identifier,
      passwordLength: payload.newPassword?.length,
      confirmPasswordMatch: payload.newPassword === payload.confirmPassword
    });
    
    return this.http.post<{ success: boolean; message: string }>('/api/v1/admin/auth/verify-password-reset', payload).pipe(
      tap(response => console.log('Réponse de réinitialisation de mot de passe:', response)),
      catchError(error => {
        console.error('Erreur de réinitialisation de mot de passe:', error);
        console.error('Détails de l\'erreur:', error.error);
        throw error;
      })
    );
  }
  
  sendOtp(data: { identifier: string; channel?: 'email' | 'sms' | 'both' }): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>('/api/v1/admin/auth/send-otp', data);
  }
  
  verifyOtp(data: { identifier?: string; otp: string }): Observable<User> {
    // Récupérer le nom d'utilisateur stocké temporairement ou utiliser celui fourni
    const username = data.identifier || localStorage.getItem('temp_username');
    if (!username) {
      console.error('Aucun utilisateur en attente de vérification OTP');
      throw new Error('Aucun utilisateur en attente de vérification OTP');
    }
    
    return this.http.post<User>('/api/v1/admin/auth/verify-otp', { 
      username, // Utiliser le nom d'utilisateur stocké
      otp: data.otp 
    })
    .pipe(
      tap(user => {
        // Supprimer le stockage temporaire
        localStorage.removeItem('temp_username');
        
        // Extraction et stockage du token séparément si présent dans la réponse
        if (user.token) {
          const token = user.token;
          // Stockage du token séparé des données utilisateur
          localStorage.setItem(this.TOKEN_KEY, token);
          
          // Nettoyer le token de l'objet user avant de le stocker
          const { token: _, ...userWithoutToken } = user;
          localStorage.setItem(this.USER_KEY, JSON.stringify(userWithoutToken));
          
          // Configurer l'expiration automatique
          this.setAutoLogout(token);
        } else {
          // Fallback si le token n'est pas séparé
          localStorage.setItem(this.USER_KEY, JSON.stringify(user));
        }
        
        this.currentUserSubject.next(user);
      }),
      catchError(error => {
        console.error('Erreur de vérification OTP:', error);
        throw error;
      })
    );
  }
  
  checkAuthStatus(): Observable<User | null> {
    if (this.currentUser) {
      return of(this.currentUser);
    }
    
    return this.http.get<User>('/api/v1/admin/auth/me').pipe(
      tap(user => {
        localStorage.setItem('currentUser', JSON.stringify(user));
        this.currentUserSubject.next(user);
      }),
      catchError(() => {
        localStorage.removeItem('currentUser');
        this.currentUserSubject.next(null);
        return of(null);
      })
    );
  }
  
//  updateUserData(user: User): void {
//    localStorage.setItem('currentUser', JSON.stringify(user));
//    this.currentUserSubject.next(user);
//  }
  
  /**
   * Met à jour le token JWT actuel et réinitialise le timer d'expiration
   * @param token Le nouveau token JWT
   */
  updateToken(token: string): void {
    if (!token) {
      return;
    }
    
    try {
      // Stocker le nouveau token
      localStorage.setItem(this.TOKEN_KEY, token);
      
      // Mettre à jour le timer d'expiration automatique
      this.setAutoLogout(token);
      
      console.log('Token JWT mis à jour');
    } catch (error) {
      console.error('Erreur lors de la mise à jour du token:', error);
    }
  }
  
  /**
   * Obtient le token JWT actuel
   */
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }
  
  /**
   * Test simple de la connectivité API
   */
  pingApi(): Observable<any> {
    console.log('Test de connexion à l\'API');
    return this.http.post('/api/v1/admin/auth/ping', { 
      clientTimestamp: new Date().toISOString() 
    }).pipe(
      tap(response => console.log('Ping API réussi:', response)),
      catchError(error => {
        console.error('Erreur de ping API:', error);
        console.error('Détails:', {
          status: error.status,
          statusText: error.statusText,
          message: error.error?.message,
          url: error.url
        });
        throw error;
      })
    );
  }
  
  /**
   * Exécute un diagnostic de connectivité à la base de données
   */
  diagnoseDatabaseConnection(): Observable<any> {
    console.log('Diagnostic de la connexion à la base de données');
    return this.http.post('/api/v1/admin/auth/diagnostic', {}).pipe(
      tap(response => console.log('Diagnostic réussi:', response)),
      catchError(error => {
        console.error('Erreur de diagnostic:', error);
        throw error;
      })
    );
  }
  
  /**
   * Méthode utilitaire pour gérer les erreurs d'API
   */
  private handleApiError(error: any, message: string): never {
    console.error(message, error);
    if (error.status === 0) {
      console.error('Erreur de connexion au serveur. Vérifiez votre connexion réseau.');
    } else if (error.status === 401) {
      this.currentUserSubject.next(null);
      localStorage.removeItem('currentUser');
    }
    
    // Enrichir l'erreur avec des détails supplémentaires
    const enhancedError = {
      ...error,
      message: error.error?.message || message,
      timestamp: new Date().toISOString()
    };
    
    throw enhancedError;
  }
  
  verifyResetCode(identifier: string, resetCode: string): Observable<{ success: boolean; message: string }> {
    console.log('Vérification du code de réinitialisation:', { identifier, resetCode });
    return this.http.post<{ success: boolean; message: string }>('/api/v1/admin/auth/verify-reset-code', { 
      identifier, 
      resetCode: resetCode  // Utiliser resetCode au lieu de token pour correspondre au backend
    }).pipe(
      tap(response => console.log('Réponse de vérification de code:', response)),
      catchError(error => {
        console.error('Erreur de vérification du code:', error);
        throw error;
      })
    );
  }
  
  /**
   * Vérifie si un token JWT est sur le point d'expirer (moins de X minutes restantes)
   * Utilisé pour déclencher un rafraîchissement proactif du token
   */
  isTokenExpiringSoon(token: string, thresholdMinutes: number = 5): boolean {
    try {
      // Décodage sécurisé du payload JWT
      const parts = token.split('.');
      if (parts.length !== 3) {
        console.warn('Format de token invalide dans isTokenExpiringSoon');
        return false;
      }
      
      const payload = JSON.parse(atob(parts[1]));
      const expiryTime = payload.exp * 1000; // Convertir en millisecondes
      const currentTime = Date.now();
      const timeToExpiry = expiryTime - currentTime;
      
      // Vérifier si le délai avant expiration est positif et inférieur au seuil
      const isExpiringSoon = timeToExpiry > 0 && timeToExpiry < (thresholdMinutes * 60 * 1000);
      
      if (isExpiringSoon) {
        console.log(`Token expirant bientôt - expire dans ${Math.round(timeToExpiry/1000)}s - seuil: ${thresholdMinutes * 60}s`);
      }
      
      return isExpiringSoon;
    } catch (e) {
      console.error('Erreur lors de la vérification de l\'expiration imminente du token:', e);
      return false; // Éviter un refresh en cas d'erreur
    }
  }
  
  /**
   * Envoie une demande pour rafraîchir le token JWT avant son expiration
   */
  refreshToken(): Observable<{ token: string; expiresAt: string }> {
    const currentToken = localStorage.getItem(this.TOKEN_KEY);
    
    if (!currentToken) {
      return throwError(() => new Error('Aucun token à rafraîchir'));
    }
    
    return this.http.post<{ token: string; expiresAt: string }>('/api/v1/admin/auth/refresh-token', {}, {
      headers: { 'Authorization': `Bearer ${currentToken}` }
    }).pipe(
      tap(response => {
        if (response && response.token) {
          this.updateToken(response.token);
        }
      }),
      catchError(error => {
        console.error('Erreur lors du rafraîchissement du token:', error);
        
        // Si erreur d'autorisation, déconnexion
        if (error.status === 401) {
          this.logout();
        }
        
        return throwError(() => error);
      })
    );
  }
}