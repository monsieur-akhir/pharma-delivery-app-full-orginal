import api from './api.service';
import { Medicine } from './order.service';

/**
 * Interface for prescription data
 */
export interface Prescription {
  id: number;
  userId: number;
  imageUrl: string;
  status: 'pending' | 'processed' | 'verified' | 'rejected';
  aiAnalysisResult?: PrescriptionAnalysis;
  pharmacistNote?: string;
  isValid: boolean;
  validUntil?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Interface for prescription analysis results
 */
export interface PrescriptionAnalysis {
  detectedMedicines: {
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
    confidence: number;
    matchedMedicine?: Medicine;
  }[];
  doctorName?: string;
  patientName?: string;
  issueDate?: string;
  notes?: string;
  confidence: number;
}

/**
 * Service for handling prescription-related operations
 */
class PrescriptionService {
  /**
   * Upload prescription image and get AI analysis
   * @param prescriptionImage Base64 encoded image data
   */
  async uploadPrescription(prescriptionImage: string) {
    try {
      const response = await api.post('/prescriptions/upload', {
        image: prescriptionImage
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get user's prescription history
   */
  async getUserPrescriptions() {
    try {
      const response = await api.get('/prescriptions/user');
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get a specific prescription by ID
   * @param prescriptionId Prescription ID
   */
  async getPrescriptionById(prescriptionId: number) {
    try {
      const response = await api.get(`/prescriptions/${prescriptionId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Request video verification for a prescription
   * @param prescriptionId Prescription ID
   */
  async requestVideoVerification(prescriptionId: number) {
    try {
      const response = await api.post(`/prescriptions/${prescriptionId}/request-verification`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Find pharmacies that have all medicines from a prescription
   * @param prescriptionId Prescription ID
   * @param latitude User's latitude
   * @param longitude User's longitude
   */
  async findPharmaciesWithPrescriptionMedicines(
    prescriptionId: number,
    latitude: number,
    longitude: number
  ) {
    try {
      const response = await api.get(`/prescriptions/${prescriptionId}/available-pharmacies`, {
        params: { latitude, longitude }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }
}

export default new PrescriptionService();