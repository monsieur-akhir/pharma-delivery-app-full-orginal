import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { API_URL } from '../config';
import { store } from '../store';
import { loginSuccess, logoutUser } from '../store/auth/authSlice';

class ApiService {
  private api: AxiosInstance;
  
  constructor() {
    this.api = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    this.setupInterceptors();
  }
  
  private setupInterceptors(): void {
    // Add token to all requests
    this.api.interceptors.request.use(
      (config) => {
        const state = store.getState();
        const token = state.auth.token;
        
        if (token && config.headers) {
          config.headers['Authorization'] = `Bearer ${token}`;
        }
        
        return config;
      },
      (error) => Promise.reject(error)
    );
    
    // Handle errors
    this.api.interceptors.response.use(
      (response: AxiosResponse) => response,
      (error) => {
        if (error.response) {
          // The request was made and the server responded with a status code
          // that falls out of the range of 2xx
          const { status } = error.response;
          
          if (status === 401) {
            store.dispatch(logoutUser());
          }
        }
        
        return Promise.reject(error);
      }
    );
  }
  
  // Generic request methods
  public async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.api.get<T>(url, config);
      return response.data;
    } catch (error) {
      return this.handleError(error);
    }
  }
  
  public async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.api.post<T>(url, data, config);
      return response.data;
    } catch (error) {
      return this.handleError(error);
    }
  }
  
  public async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.api.put<T>(url, data, config);
      return response.data;
    } catch (error) {
      return this.handleError(error);
    }
  }
  
  public async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.api.delete<T>(url, config);
      return response.data;
    } catch (error) {
      return this.handleError(error);
    }
  }
  
  public async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.api.patch<T>(url, data, config);
      return response.data;
    } catch (error) {
      return this.handleError(error);
    }
  }
  
  // Auth specific methods
  public async login(phone: string, otp: string, userType: 'customer' | 'delivery' = 'customer'): Promise<any> {
    try {
      const response = await this.api.post('/auth/verify-otp', { phone, otp, userType });
      const userData = response.data;
      
      // Store user data in Redux
      store.dispatch(loginSuccess(userData));
      
      return userData;
    } catch (error) {
      return this.handleError(error);
    }
  }
  
  public async requestOtp(phone: string, userType: 'customer' | 'delivery' = 'customer'): Promise<any> {
    try {
      const response = await this.api.post('/auth/send-otp', { phone, userType });
      return response.data;
    } catch (error) {
      return this.handleError(error);
    }
  }
  
  public async refreshToken(): Promise<any> {
    try {
      const state = store.getState();
      const currentToken = state.auth.token;
      
      if (!currentToken) {
        throw new Error('Aucun token à rafraîchir');
      }
      
      const response = await this.api.post('/auth/refresh-token', {}, {
        headers: {
          'Authorization': `Bearer ${currentToken}`
        }
      });
      
      return response.data;
    } catch (error) {
      return this.handleError(error);
    }
  }
  
  public async logout(): Promise<any> {
    try {
      const state = store.getState();
      const currentToken = state.auth.token;
      
      if (currentToken) {
        // Invalider le token côté serveur
        await this.api.post('/auth/logout', {}, {
          headers: {
            'Authorization': `Bearer ${currentToken}`
          }
        });
      }
      
      // Déconnecter dans le store
      store.dispatch(logoutUser());
      return { success: true };
    } catch (error) {
      // Même en cas d'erreur, déconnecter côté client
      store.dispatch(logoutUser());
      return this.handleError(error);
    }
  }
  
  // Utilisateurs et profils
  public async updateProfile(userData: Partial<any>): Promise<any> {
    try {
      const response = await this.api.put('/users/me/profile', userData);
      return response.data;
    } catch (error) {
      return this.handleError(error);
    }
  }
  
  private handleError(error: any): never {
    console.error('API Service Error:', error.response || error);
    
    // Create a more user-friendly error message
    let message = 'Une erreur est survenue. Veuillez réessayer plus tard.';
    
    if (error.response) {
      const { status, data } = error.response;
      
      switch (status) {
        case 400:
          message = data.message || 'Données invalides. Veuillez vérifier vos informations.';
          break;
        case 401:
          message = 'Session expirée. Veuillez vous reconnecter.';
          break;
        case 403:
          message = 'Accès refusé. Vous n\'avez pas les permissions nécessaires.';
          break;
        case 404:
          message = 'La ressource demandée n\'a pas été trouvée.';
          break;
        case 500:
          message = 'Erreur serveur. Veuillez réessayer plus tard.';
          break;
      }
    }
    
    throw new Error(message);
  }
}

// Create a singleton instance
const apiService = new ApiService();
export default apiService;