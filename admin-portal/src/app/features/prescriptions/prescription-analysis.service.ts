import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface PrescriptionAnalysisData {
  timeframe: string;
  confidenceRates: number[];
  processingTimes: number[];
  errorRates: number[];
  recognitionRates: number[];
  labels: string[];
}

export interface PrescriptionTrend {
  medicineName: string;
  trendsData: {
    labels: string[];
    values: number[];
  };
  growth: number;
  category: string;
  importance: 'high' | 'medium' | 'low';
}

export interface PrescriptionInsight {
  category: string;
  description: string;
  actionable: boolean;
  priority: 'high' | 'medium' | 'low';
  affectedItems: string[];
}

@Injectable({
  providedIn: 'root'
})
export class PrescriptionAnalysisService {
  private apiUrl = `${environment.apiUrl}/v1/admin/ai-analytics`;

  constructor(private http: HttpClient) { }

  /**
   * Get prescription analysis performance metrics
   */
  getPrescriptionAnalysisMetrics(timeframe: string = '30d'): Observable<PrescriptionAnalysisData> {
    return this.http.get<PrescriptionAnalysisData>(`${this.apiUrl}/prescription-metrics`, {
      params: { timeframe }
    });
  }

  /**
   * Get trending medications from prescriptions
   */
  getTrendingMedications(timeframe: string = '30d', limit: number = 10): Observable<PrescriptionTrend[]> {
    return this.http.get<PrescriptionTrend[]>(`${this.apiUrl}/trending-medications`, {
      params: { 
        timeframe,
        limit: limit.toString()
      }
    });
  }

  /**
   * Get category distribution in prescriptions
   */
  getMedicationCategoryDistribution(timeframe: string = '30d'): Observable<{ labels: string[], data: number[] }> {
    return this.http.get<{ labels: string[], data: number[] }>(`${this.apiUrl}/medication-categories`, {
      params: { timeframe }
    });
  }

  /**
   * Get AI-generated insights about prescription patterns
   */
  getPrescriptionInsights(timeframe: string = '30d'): Observable<PrescriptionInsight[]> {
    return this.http.get<PrescriptionInsight[]>(`${this.apiUrl}/prescription-insights`, {
      params: { timeframe }
    });
  }

  /**
   * Request AI analysis on specific prescriptions
   */
  analyzeSpecificPrescriptions(prescriptionIds: number[]): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/analyze-prescriptions`, { prescriptionIds });
  }

  /**
   * Get anomaly detection results for unusual prescription patterns
   */
  getAnomalyDetectionResults(timeframe: string = '30d', sensitivity: number = 0.7): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/prescription-anomalies`, {
      params: { 
        timeframe,
        sensitivity: sensitivity.toString() 
      }
    });
  }

  /**
   * Export prescription analysis data
   */
  exportPrescriptionAnalysisData(timeframe: string = '30d', format: 'csv' | 'json' = 'csv'): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/export-prescription-analysis`, {
      params: { 
        timeframe,
        format 
      },
      responseType: 'blob'
    });
  }
}