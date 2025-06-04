import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse,
  HttpResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

@Injectable()
export class TokenInterceptor implements HttpInterceptor {
  constructor(private authService: AuthService) {}
  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {    // Ne pas ajouter de token pour les opérations de refresh token pour éviter un cycle
    if (request.url.includes('/api/v1/admin/auth/refresh-token')) {
      console.log('Skipping token for refresh token request');
      return next.handle(request);
    }
    
    // Ajouter le token JWT aux requêtes sortantes
    const token = localStorage.getItem('auth_token');
    
    if (token) {
      request = request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }    // Traiter la réponse pour gérer les tokens rafraîchis
    return next.handle(request).pipe(
      tap({
        next: (event) => {
          if (event instanceof HttpResponse) {
            // Vérifier si un nouveau token est présent dans l'en-tête de la réponse
            const newToken = event.headers.get('X-New-Token');
            if (newToken) {
              // Mettre à jour le token stocké
              this.authService.updateToken(newToken);
            }
          }
        }
      }),
      catchError((error) => {
        if (error instanceof HttpErrorResponse) {
          // Ne gérer que les erreurs 403, car 401 est géré par l'AuthInterceptor
          if (error.status === 403) {
            console.warn(`Erreur 403 dans TokenInterceptor: ${error.error?.message || 'Accès interdit'}`);
          }
        }
        return throwError(() => error);
      })
    );
  }
}
