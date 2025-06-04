import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor, HttpErrorResponse, HttpContext, HttpContextToken } from '@angular/common/http';
import { Observable, throwError, of, BehaviorSubject } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { catchError, switchMap, filter, take, finalize, tap } from 'rxjs/operators';
import { Router } from '@angular/router';

// Token de contexte pour indiquer que le token JWT est sur le point d'expirer
export const TOKEN_EXPIRING = new HttpContextToken<boolean>(() => false);

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private isRefreshing = false;
  private refreshTokenSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);

  constructor(private authService: AuthService, private router: Router) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // Skip authorization for login and refresh token requests
    if (request.url.includes('/v1/admin/auth/login') || request.url.includes('/v1/admin/auth/refresh-token')) {
      return next.handle(request);
    }
    
    // Get the token from localStorage instead of user object
    const token = localStorage.getItem('auth_token');
    
    // If token exists, add Authorization header
    if (token) {
      // Check if token is expired before sending the request
      if (this.authService.isTokenExpiringSoon(token) && !this.isRefreshing) {
        console.log('Token expiring soon, refreshing...');
        request = this.addToken(request, token);
        return this.handle401Error(request, next);
      }
      
      request = this.addToken(request, token);
    }
    
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        // Vérifier si on est sur la page de connexion ou si la requête est liée à l'authentification
        const isAuthRelated = request.url.includes('/v1/admin/auth/');
        const isCurrentlyLoggingIn = this.router.url.includes('/auth');
        const isNavigatingFromLogin = this.router.url === '/' && localStorage.getItem('auth_token');
        
        if (error.status === 401) {
          // Si ce n'est pas lié à l'authentification et qu'on n'est pas en train de rafraîchir un token
          if (!isAuthRelated && !this.isRefreshing) {
            console.log('Tentative de rafraîchissement de token suite à une erreur 401', request.url);
            return this.handle401Error(request, next);
          } else if (isAuthRelated || isCurrentlyLoggingIn) {
            console.warn('401 error sur une requête d\'auth - normal pendant le processus de login', {
              url: request.url
            });
          }
        }
        
        return throwError(() => error);
      })
    );
  }

  private addToken(request: HttpRequest<any>, token: string) {
    return request.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  private handle401Error(request: HttpRequest<any>, next: HttpHandler) {
    // Si on n'est pas déjà en train de rafraîchir le token
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshTokenSubject.next(null);
      console.log('Tentative de rafraîchissement du token...');

      return this.authService.refreshToken().pipe(
        switchMap((token: any) => {
          this.isRefreshing = false;
          console.log('Token rafraîchi avec succès, nouvelle expiration:', token.expiresAt);
          this.refreshTokenSubject.next(token.token);
          
          // Utiliser le nouveau token pour refaire la requête originale
          return next.handle(this.addToken(request, token.token));
        }),
        catchError(error => {
          this.isRefreshing = false;
          console.error('Échec du rafraîchissement du token:', error);
          
          // Si le rafraîchissement échoue, déconnecter l'utilisateur
          if (!request.url.includes('/admin/auth/')) {
            console.error('Le rafraîchissement du token a échoué, déconnexion', error);
            this.authService.logout('token-refresh-failed');
            this.router.navigate(['/auth'], { 
              queryParams: { returnUrl: this.router.url !== '/auth' ? this.router.url : '/dashboard' }
            });
          }
          
          return throwError(() => error);
        }),
        finalize(() => {
          this.isRefreshing = false;
        })
      );
    } else {
      // Attendre que le token soit rafraîchi
      return this.refreshTokenSubject.pipe(
        filter(token => token !== null),
        take(1),
        switchMap(token => {
          return next.handle(this.addToken(request, token));
        })
      );
    }
  }
}