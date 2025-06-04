import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, throwError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const authService = inject(AuthService);
  const snackBar = inject(MatSnackBar);
  
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        // Auto logout si on reçoit un 401 Unauthorized
        authService.logout();
        router.navigate(['/login']);
        
        snackBar.open('Votre session a expiré, veuillez vous reconnecter', 'Fermer', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
      
      if (error.status === 403) {
        snackBar.open('Accès non autorisé', 'Fermer', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
      
      const errorMessage = error.error?.message || error.statusText || 'Une erreur est survenue';
      
      snackBar.open(errorMessage, 'Fermer', {
        duration: 5000,
        panelClass: ['error-snackbar']
      });
      
      return throwError(() => error);
    })
  );
};