import apiService from './api.service';
import authService from './auth.service';

/**
 * Service de gestion des livraisons pour les coursiers
 */
class DeliveryService {
  /**
   * Récupère les livraisons assignées au coursier connecté
   */
  async getAssignedDeliveries(status?: string): Promise<any> {
    try {
      // Vérifier que l'utilisateur est un coursier
      if (!authService.isDeliveryPerson()) {
        throw new Error('Permissions insuffisantes: accès coursier requis');
      }
      
      const params = status ? { status } : {};
      const response = await apiService.get('/deliveries/assigned', { params });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des livraisons:', error);
      throw error;
    }
  }

  /**
   * Récupère les livraisons disponibles pour le coursier
   */
  async getAvailableDeliveries(): Promise<any> {
    try {
      const response = await apiService.get('/deliveries/available');
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des livraisons disponibles:', error);
      throw error;
    }
  }

  /**
   * Accepter une livraison disponible
   */
  async acceptDelivery(deliveryId: number): Promise<any> {
    try {
      const response = await apiService.post(`/deliveries/${deliveryId}/accept`);
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de l'acceptation de la livraison #${deliveryId}:`, error);
      throw error;
    }
  }

  /**
   * Décliner une livraison
   */
  async declineDelivery(deliveryId: number, reason?: string): Promise<any> {
    try {
      const response = await apiService.post(`/deliveries/${deliveryId}/decline`, {
        reason
      });
      return response.data;
    } catch (error) {
      console.error(`Erreur lors du déclin de la livraison #${deliveryId}:`, error);
      throw error;
    }
  }

  /**
   * Mettre à jour le statut en ligne/hors ligne du coursier
   */
  async updateOnlineStatus(isOnline: boolean): Promise<any> {
    try {
      const response = await apiService.put('/deliverers/online-status', {
        isOnline
      });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut en ligne:', error);
      throw error;
    }
  }

  /**
   * Récupérer le statut en ligne du coursier
   */
  async getOnlineStatus(): Promise<any> {
    try {
      const response = await apiService.get('/deliverers/online-status');
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération du statut en ligne:', error);
      throw error;
    }
  }

  /**
   * Récupérer les statistiques du coursier
   */
  async getDelivererStats(): Promise<any> {
    try {
      const response = await apiService.get('/deliverers/stats');
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      throw error;
    }
  }

  /**
   * Marquer l'arrivée à la pharmacie
   */
  async markArrivedAtPharmacy(deliveryId: number): Promise<any> {
    try {
      const response = await apiService.post(`/deliveries/${deliveryId}/arrived-pharmacy`);
      return response.data;
    } catch (error) {
      console.error(`Erreur lors du marquage d'arrivée à la pharmacie pour la livraison #${deliveryId}:`, error);
      throw error;
    }
  }

  /**
   * Marquer la récupération des médicaments
   */
  async markMedicationPickedUp(deliveryId: number, items: any[]): Promise<any> {
    try {
      const response = await apiService.post(`/deliveries/${deliveryId}/picked-up`, {
        items,
        timestamp: Date.now()
      });
      return response.data;
    } catch (error) {
      console.error(`Erreur lors du marquage de récupération pour la livraison #${deliveryId}:`, error);
      throw error;
    }
  }

  /**
   * Marquer l'arrivée chez le client
   */
  async markArrivedAtCustomer(deliveryId: number): Promise<any> {
    try {
      const response = await apiService.post(`/deliveries/${deliveryId}/arrived-customer`);
      return response.data;
    } catch (error) {
      console.error(`Erreur lors du marquage d'arrivée chez le client pour la livraison #${deliveryId}:`, error);
      throw error;
    }
  }

  /**
   * Envoyer un code de vérification au client
   */
  async sendVerificationCode(deliveryId: number): Promise<any> {
    try {
      const response = await apiService.post(`/deliveries/${deliveryId}/send-verification-code`);
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de l'envoi du code de vérification pour la livraison #${deliveryId}:`, error);
      throw error;
    }
  }

  /**
   * Vérifier le code de livraison
   */
  async verifyDeliveryCode(deliveryId: number, code: string): Promise<any> {
    try {
      const response = await apiService.post(`/deliveries/${deliveryId}/verify-code`, {
        code
      });
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la vérification du code pour la livraison #${deliveryId}:`, error);
      throw error;
    }
  }

  /**
   * Signaler un problème pendant la livraison
   */
  async reportIssue(deliveryId: number, issueType: string, description: string, photos?: string[]): Promise<any> {
    try {
      const response = await apiService.post(`/deliveries/${deliveryId}/report-issue`, {
        issueType,
        description,
        photos,
        timestamp: Date.now()
      });
      return response.data;
    } catch (error) {
      console.error(`Erreur lors du signalement d'un problème pour la livraison #${deliveryId}:`, error);
      throw error;
    }
  }

  /**
   * Uploader une photo de preuve de livraison
   */
  async uploadDeliveryProof(deliveryId: number, photoUri: string): Promise<any> {
    try {
      const formData = new FormData();
      formData.append('photo', {
        uri: photoUri,
        type: 'image/jpeg',
        name: `delivery_proof_${deliveryId}_${Date.now()}.jpg`,
      } as any);

      const response = await apiService.post(`/deliveries/${deliveryId}/upload-proof`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de l'upload de la preuve pour la livraison #${deliveryId}:`, error);
      throw error;
    }
  }

  /**
   * Récupérer l'historique des livraisons du coursier
   */
  async getDeliveryHistory(page: number = 1, limit: number = 20): Promise<any> {
    try {
      const response = await apiService.get('/deliveries/history', {
        params: { page, limit }
      });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'historique:', error);
      throw error;
    }
  }

  /**
   * Récupérer les gains du coursier
   */
  async getEarnings(period: 'today' | 'week' | 'month'): Promise<any> {
    try {
      const response = await apiService.get(`/deliverers/earnings?period=${period}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des gains:', error);
      throw error;
    }
  }

  /**
   * Mettre à jour les informations de profil du coursier
   */
  async updateDelivererProfile(profileData: any): Promise<any> {
    try {
      const response = await apiService.put('/deliverers/profile', profileData);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la mise à jour du profil:', error);
      throw error;
    }
  }

  /**
   * Récupérer les notifications pour le coursier
   */
  async getDelivererNotifications(): Promise<any> {
    try {
      const response = await apiService.get('/deliverers/notifications');
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des notifications:', error);
      throw error;
    }
  }

  /**
   * Marquer une notification comme lue
   */
  async markNotificationAsRead(notificationId: number): Promise<any> {
    try {
      const response = await apiService.put(`/notifications/${notificationId}/read`);
      return response.data;
    } catch (error) {
      console.error(`Erreur lors du marquage de la notification #${notificationId} comme lue:`, error);
      throw error;
    }
  }
  
  /**
   * Récupère les détails d'une livraison
   */
  async getDeliveryDetails(deliveryId: number): Promise<any> {
    try {
      const response = await apiService.get(`/deliveries/${deliveryId}`);
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la récupération des détails de la livraison #${deliveryId}:`, error);
      throw error;
    }
  }
  
  /**
   * Mettre à jour le statut d'une livraison
   * @param deliveryId ID de la livraison
   * @param status Nouveau statut (en_cours, livré, etc.)
   * @param notes Notes optionnelles
   */
  async updateDeliveryStatus(deliveryId: number, status: string, notes?: string): Promise<any> {
    try {
      const response = await apiService.put(`/deliveries/${deliveryId}/status`, {
        status,
        notes
      });
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la mise à jour du statut de la livraison #${deliveryId}:`, error);
      throw error;
    }
  }
  
  /**
   * Envoyer la position GPS actuelle pour le suivi de livraison
   */
  async updateLocationData(deliveryId: number, latitude: number, longitude: number): Promise<any> {
    try {
      const response = await apiService.post('/location/update', {
        deliveryId,
        latitude,
        longitude,
        timestamp: Date.now()
      });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la position:', error);
      throw error;
    }
  }
  
  /**
   * Marquer une livraison comme complétée
   */
  async completeDelivery(deliveryId: number, signature?: string, photo?: string): Promise<any> {
    try {
      const data: any = { status: 'delivered' };
      
      if (signature) {
        data.signature = signature;
      }
      
      if (photo) {
        data.proofPhoto = photo;
      }
      
      const response = await apiService.put(`/deliveries/${deliveryId}/complete`, data);
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la complétion de la livraison #${deliveryId}:`, error);
      throw error;
    }
  }
}

const deliveryService = new DeliveryService();
export default deliveryService;
