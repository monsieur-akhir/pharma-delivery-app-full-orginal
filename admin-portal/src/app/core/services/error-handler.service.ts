import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root'
})
export class ErrorHandlerService {
  constructor(private snackBar: MatSnackBar) {}

  handleError(error: HttpErrorResponse | Error): void {
    let errorMessage: string;

    if (error instanceof HttpErrorResponse) {
      // Server or connection error
      if (!navigator.onLine) {
        errorMessage = 'Pas de connexion internet';
      } else if (error.status === 0) {
        errorMessage = 'Le serveur ne répond pas';
      } else {
        // API error with status code
        const serverError = error.error;
        errorMessage = serverError?.message || `Erreur du serveur: ${error.status}`;
      }
    } else {
      // Client-side error
      errorMessage = error.message || 'Une erreur est survenue';
    }

    // Log the error for debugging
    console.error('Error occurred:', error);

    // Show user-friendly message
    this.snackBar.open(errorMessage, 'Fermer', {
      duration: 5000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
      panelClass: ['error-snackbar']
    });
  }
}
