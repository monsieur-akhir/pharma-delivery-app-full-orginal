
import { Alert } from 'react-native';

export class ErrorHandler {
  static handle(error: any, context?: string) {
    console.error(`Error ${context ? `in ${context}` : ''}:`, error);
    
    let message = 'Une erreur inattendue s\'est produite';
    
    if (error.response?.status === 401) {
      message = 'Session expirée, veuillez vous reconnecter';
    } else if (error.response?.status === 403) {
      message = 'Accès non autorisé';
    } else if (error.response?.status === 404) {
      message = 'Ressource non trouvée';
    } else if (error.response?.status >= 500) {
      message = 'Erreur serveur, veuillez réessayer plus tard';
    } else if (error.message === 'Network Error') {
      message = 'Problème de connexion internet';
    } else if (error.response?.data?.message) {
      message = error.response.data.message;
    }

    Alert.alert('Erreur', message);
  }

  static async handleAsync(promise: Promise<any>, context?: string) {
    try {
      return await promise;
    } catch (error) {
      this.handle(error, context);
      throw error;
    }
  }
}
