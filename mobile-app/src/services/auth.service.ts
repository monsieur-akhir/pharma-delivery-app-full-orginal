import { store } from '../store';
import apiService from './api.service';
import { loginSuccess, logoutUser, updateUserProfile, refreshToken } from '../store/auth/authSlice';

export interface UserProfile {
  id: number;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  avatar?: string;
  role?: string; // 'CUSTOMER' ou 'DELIVERY_PERSON' pour les utilisateurs mobiles
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

// Clés de stockage utilisées pour les tokens et données utilisateur
const TOKEN_KEY = 'auth_token';
const USER_KEY = 'user_data';
const TOKEN_EXPIRY_KEY = 'token_expiry';

class AuthService {
  private tokenRefreshTimer: any = null;
  private currentUser: any = null;
  private token: string | null = null;

  constructor() {
    // Initialiser la vérification du token au démarrage de l'application
    this.initTokenCheck();
  }

  /**
   * Initialise la vérification du token au démarrage
   */
  private async initTokenCheck() {
    try {
      // Réimplémentation simplifiée - réutiliser le token existant si stocké dans le store Redux
      const state = store.getState();
      if (state.auth && state.auth.token) {
        const token = state.auth.token;

        // Vérifier si le token est valide
        if (token && this.isTokenValid(token)) {
          // Configurer le timer pour rafraîchir avant expiration
          this.setupTokenRefresh(token);
        } else {
          // Token expiré, déconnecter l'utilisateur
          this.logout();
        }
      }
    } catch (error) {
      console.error('Erreur lors de la vérification du token:', error);
    }
  }

  /**
   * Vérifie si un token JWT est valide et non expiré
   */
  private isTokenValid(token: string): boolean {
    try {
      const decoded = this.parseJwt(token);
      return decoded && decoded.exp * 1000 > Date.now();
    } catch (error) {
      return false;
    }
  }

  /**
   * Configure le timer pour rafraîchir le token avant qu'il n'expire
   */
  private setupTokenRefresh(token: string) {
    // Effacer tout timer existant
    if (this.tokenRefreshTimer) {
      clearTimeout(this.tokenRefreshTimer);
    }

    try {
      const decoded = this.parseJwt(token);
      if (!decoded || !decoded.exp) return;

      const expiryTime = decoded.exp * 1000;

      // Calculer le délai avant rafraîchissement (5 minutes avant expiration)
      const now = Date.now();
      const timeToRefresh = expiryTime - now - 5 * 60 * 1000; // 5 minutes avant expiration

      if (timeToRefresh > 0) {
        this.tokenRefreshTimer = setTimeout(() => {
          this.refreshCurrentToken();
        }, timeToRefresh);

        console.log(`Token sera rafraîchi dans ${Math.round(timeToRefresh / 60000)} minutes`);
      } else if (timeToRefresh > -30 * 60 * 1000) { 
        // Si le token expire dans moins de 5 minutes mais n'est pas expiré depuis plus de 30 minutes
        this.refreshCurrentToken();
      } else {
        // Token trop ancien, déconnecter
        this.logout();
      }
    } catch (error) {
      console.error('Erreur lors de la configuration du rafraîchissement du token:', error);
    }
  }

  /**
   * Parse un token JWT pour extraire les données
   */
  private parseJwt(token: string): any {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Erreur parse JWT:', error);
      return null;
    }
  }

  getCurrentUser(): any | null {
    return this.currentUser;
  }

  getToken(): string | null {
    return this.token;
  }

  async requestOtp(phone: string, userType: string = 'customer'): Promise<{ success: boolean; message: string; }> {
    try {
      return await apiService.post('/auth/request-otp', { phone, userType });
    } catch (error) {
      throw error;
    }
  }

  async completeProfile(profileData: any): Promise<any> {
    try {
      return await apiService.post('/auth/complete-profile', profileData);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Send OTP to the user's phone
   * @param phone User's phone number
   * @param userType Type d'utilisateur ('customer' ou 'delivery')
   * @returns Promise with success status and message
   */
  async sendOtp(phone: string, userType: 'customer' | 'delivery' = 'customer'): Promise<{ success: boolean; message: string }> {
    try {
      return await apiService.requestOtp(phone, userType);
    } catch (error) {
      console.error('Error sending OTP:', error);
      throw error;
    }
  }

  /**
   * Verify OTP and login user
   * @param phone User's phone number
   * @param otp OTP code received by the user
   * @param userType Type d'utilisateur ('customer' ou 'delivery')
   * @returns Promise with user data and token
   */
  async verifyOtp(phone: string, otp: string, userType: 'customer' | 'delivery' = 'customer'): Promise<any> {
    try {
      const response = await apiService.login(phone, otp, userType);

      if (response && response.token) {
        // Configurer le timer de rafraîchissement pour le nouveau token
        this.setupTokenRefresh(response.token);
      }

      return response;
    } catch (error) {
      console.error('Error verifying OTP:', error);
      throw error;
    }
  }

  /**
   * Rafraîchir le token actuel avant qu'il n'expire
   */
  private async refreshCurrentToken() {
    try {
      const response = await apiService.refreshToken();

      if (response && response.token) {
        // Mettre à jour le token dans le store
        store.dispatch(refreshToken(response.token));

        // Reconfigurer le timer pour le nouveau token
        this.setupTokenRefresh(response.token);

        console.log('Token rafraîchi avec succès');
        return response.token;
      }
    } catch (error) {
      console.error('Erreur rafraîchissement token:', error);
      // En cas d'échec du rafraîchissement, déconnexion
      this.logout();
      return null;
    }
  }

  /**
   * Complete user profile after authentication
   * @param userData User profile data to update
   * @returns Promise with updated user data
   */
  async updateProfile(userData: Partial<UserProfile>): Promise<UserProfile> {
    try {
      // Implement profile update logic
      const response = await apiService.updateProfile(userData);
      const updatedProfile = response.data.user;

      // Update user in the store
      store.dispatch(updateUserProfile(updatedProfile));

      return updatedProfile;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  }

  /**
   * Log out user
   */
  async logout(): Promise<void> {
    try {
      // Effacer le timer de rafraîchissement
      if (this.tokenRefreshTimer) {
        clearTimeout(this.tokenRefreshTimer);
        this.tokenRefreshTimer = null;
      }

      // Appeler l'API pour invalider le token côté serveur
      await apiService.logout();
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  }

  /**
   * Check if user is authenticated
   * @returns Boolean indicating if user is authenticated
   */
  isAuthenticated(): boolean {
    const state = store.getState();
    return !!state.auth.token && this.isTokenValid(state.auth.token);
  }

  isDeliveryPerson(): boolean {
    const state = store.getState();
    return !!state.auth.user && (state.auth.user.role === 'DELIVERY_PERSON' || state.auth.user.role === 'delivery');
  }

  /**
   * Check if user is a customer
   * @returns Boolean indicating if user is a customer
   */
  isCustomer(): boolean {
    const state = store.getState();
    return !!state.auth.user && state.auth.user.role === 'CUSTOMER';
  }
}

const authService = new AuthService();
export default authService;