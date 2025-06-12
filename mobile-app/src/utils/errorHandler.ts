import { Alert } from 'react-native';
import * as Sentry from '@sentry/react-native';

export interface AppError {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
}

export class ErrorHandler {
  static logError(error: any, context?: string) {
    const errorInfo = {
      message: error.message || 'Unknown error',
      stack: error.stack,
      context,
      timestamp: new Date()
    };

    console.error('Error logged:', errorInfo);

    // Log to crash reporting service
    if (__DEV__) {
      console.warn('Error occurred:', errorInfo);
    } else {
      // Sentry.captureException(error, { extra: { context } });
    }
  }

  static handleApiError(error: any): AppError {
    if (error.response) {
      // Server responded with error status
      return {
        code: `HTTP_${error.response.status}`,
        message: error.response.data?.message || 'Erreur du serveur',
        details: error.response.data,
        timestamp: new Date()
      };
    } else if (error.request) {
      // Network error
      return {
        code: 'NETWORK_ERROR',
        message: 'Problème de connexion réseau',
        timestamp: new Date()
      };
    } else {
      // Other error
      return {
        code: 'UNKNOWN_ERROR',
        message: error.message || 'Une erreur inattendue s\'est produite',
        timestamp: new Date()
      };
    }
  }

  static showUserFriendlyError(error: AppError) {
    let title = 'Erreur';
    let message = error.message;

    switch (error.code) {
      case 'NETWORK_ERROR':
        title = 'Connexion';
        message = 'Vérifiez votre connexion internet et réessayez.';
        break;
      case 'HTTP_401':
        title = 'Authentification';
        message = 'Votre session a expiré. Veuillez vous reconnecter.';
        break;
      case 'HTTP_403':
        title = 'Accès refusé';
        message = 'Vous n\'avez pas les permissions nécessaires.';
        break;
      case 'HTTP_404':
        title = 'Non trouvé';
        message = 'La ressource demandée est introuvable.';
        break;
      case 'HTTP_500':
        title = 'Erreur serveur';
        message = 'Problème temporaire du serveur. Réessayez plus tard.';
        break;
    }

    Alert.alert(title, message, [
      { text: 'OK', style: 'default' }
    ]);
  }
}

export const handleError = (error: any, context?: string) => {
  ErrorHandler.logError(error, context);
  const appError = ErrorHandler.handleApiError(error);
  ErrorHandler.showUserFriendlyError(appError);
};