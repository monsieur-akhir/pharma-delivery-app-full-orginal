import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { Role } from './rbac.model';
import { RbacService } from './rbac.service';

export interface User {
  id: number;
  username: string;
  email: string;
  role: Role;
  firstName?: string;
  lastName?: string;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoginRequest {
  identifier: string;
  password: string;
}

export interface OtpRequest {
  username: string;
  otp: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/v1/admin/auth`;
  private tokenKey = 'pharmacy_admin_token';
  private userKey = 'pharmacy_admin_user';
  
  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser: Observable<User | null>;
  
  constructor(
    private http: HttpClient,
    private router: Router,
    private rbacService: RbacService
  ) {
    const storedUser = this.getStoredUser();
    this.currentUserSubject = new BehaviorSubject<User | null>(storedUser);
    this.currentUser = this.currentUserSubject.asObservable();
    
    // Initialiser le service RBAC si un utilisateur est déjà connecté
    if (storedUser) {
      this.rbacService.initializeUserRole(storedUser.role);
    }
  }

  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  /**
   * Première étape de connexion : identifiant + mot de passe pour recevoir OTP
   */
  login(identifier: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, { identifier, password })
      .pipe(
        catchError(error => {
          console.error('Login error', error);
          return throwError(() => error.error?.message || 'Identifiants invalides. Veuillez réessayer.');
        })
      );
  }

  /**
   * Seconde étape de connexion : vérification de l'OTP
   */
  verifyOtp(username: string, otp: string): Observable<User> {
    return this.http.post<any>(`${this.apiUrl}/verify-otp`, { username, otp })
      .pipe(
        tap(response => {
          // Stocker le token
          localStorage.setItem(this.tokenKey, response.token);
          
          // Stocker les informations de l'utilisateur
          localStorage.setItem(this.userKey, JSON.stringify(response));
          
          // Mettre à jour l'utilisateur courant
          this.currentUserSubject.next(response);
          
          // Initialiser le système RBAC avec le rôle de l'utilisateur
          this.rbacService.initializeUserRole(response.role);
        }),
        catchError(error => {
          console.error('OTP verification error', error);
          return throwError(() => error.error?.message || 'Code de vérification invalide. Veuillez réessayer.');
        })
      );
  }

  /**
   * Déconnexion de l'utilisateur
   */
  logout(): void {
    const token = this.getToken();
    if (token) {
      // Appeler l'API de déconnexion si un token existe
      this.http.post(`${this.apiUrl}/logout`, {}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }).subscribe({
        next: () => {
          console.log('Successfully logged out from server');
        },
        error: (error) => {
          console.error('Error during server logout:', error);
        },
        complete: () => {
          // Nettoyage local même si la déconnexion serveur échoue
          this.performLocalLogout();
        }
      });
    } else {
      // Si pas de token, simplement déconnexion locale
      this.performLocalLogout();
    }
  }

  /**
   * Effectue la déconnexion locale (nettoyage des données)
   */
  private performLocalLogout(): void {
    // Supprimer les informations du stockage local
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    
    // Réinitialiser l'utilisateur courant
    this.currentUserSubject.next(null);
    
    // Effacer les informations RBAC
    this.rbacService.clearUserRole();
    
    // Rediriger vers la page de connexion
    this.router.navigate(['/login']);
  }

  /**
   * Vérifier si l'utilisateur est connecté
   */
  isLoggedIn(): boolean {
    const token = this.getToken();
    return !!token;
  }

  /**
   * Obtenir le token d'authentification
   */
  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  /**
   * Obtenir les informations de l'utilisateur stockées localement
   */
  private getStoredUser(): User | null {
    const userJson = localStorage.getItem(this.userKey);
    if (userJson) {
      try {
        return JSON.parse(userJson);
      } catch (error) {
        console.error('Error parsing stored user', error);
        return null;
      }
    }
    return null;
  }

  /**
   * Vérifier si l'utilisateur a un rôle spécifique
   */
  hasRole(role: Role): boolean {
    const user = this.currentUserValue;
    return user !== null && user.role === role;
  }

  /**
   * Vérifier si l'utilisateur a un des rôles spécifiés
   */
  hasAnyRole(roles: Role[]): boolean {
    const user = this.currentUserValue;
    return user !== null && roles.includes(user.role);
  }

  /**
   * Mettre à jour le rôle de l'utilisateur
   */
  updateUserRole(userId: number, newRole: Role): Observable<User> {
    return this.http.patch<User>(`${environment.apiUrl}/v1/admin/users/${userId}/role`, { role: newRole })
      .pipe(
        tap(updatedUser => {
          // Si c'est l'utilisateur courant, mettre à jour ses informations
          const currentUser = this.currentUserValue;
          if (currentUser && currentUser.id === userId) {
            const updatedCurrentUser = { ...currentUser, role: newRole };
            
            // Mettre à jour le stockage local
            localStorage.setItem(this.userKey, JSON.stringify(updatedCurrentUser));
            
            // Mettre à jour l'observable
            this.currentUserSubject.next(updatedCurrentUser);
            
            // Mettre à jour les permissions RBAC
            this.rbacService.initializeUserRole(newRole);
          }
        }),
        catchError(error => {
          console.error('Error updating user role', error);
          return throwError('Impossible de mettre à jour le rôle de l\'utilisateur. Veuillez réessayer.');
        })
      );
  }
}