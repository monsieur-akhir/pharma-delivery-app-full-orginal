import api from './api.service';

/**
 * Pharmacy interface representing pharmacy data
 */
export interface Pharmacy {
  id: number;
  name: string;
  address: string;
  phone: string;
  email: string;
  latitude: number;
  longitude: number;
  openingHours: string;
  description?: string;
  imageUrl?: string;
  status: 'active' | 'inactive' | 'pending';
  createdAt: string;
  updatedAt: string;
}

/**
 * Service for handling pharmacy-related API calls
 */
class PharmacyService {
  /**
   * Get nearby pharmacies based on user location
   * @param latitude User's current latitude
   * @param longitude User's current longitude
   * @param radius Search radius in kilometers (default: 5)
   */
  async getNearbyPharmacies(latitude: number, longitude: number, radius: number = 5) {
    try {
      const response = await api.get('/pharmacies/nearby', {
        params: { latitude, longitude, radius }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get pharmacy details by ID
   * @param pharmacyId Pharmacy ID
   */
  async getPharmacyById(pharmacyId: number) {
    try {
      const response = await api.get(`/pharmacies/${pharmacyId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get available medicines at a specific pharmacy
   * @param pharmacyId Pharmacy ID
   * @param searchQuery Optional search term
   */
  async getPharmacyMedicines(pharmacyId: number, searchQuery?: string) {
    try {
      const response = await api.get(`/pharmacies/${pharmacyId}/medicines`, {
        params: searchQuery ? { search: searchQuery } : {}
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }
}

export default new PharmacyService();