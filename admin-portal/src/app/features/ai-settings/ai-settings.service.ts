import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface AiSetting {
  key: string;
  value: string | number | boolean;
  description: string;
  dataType: 'string' | 'number' | 'boolean';
  category: string;
  isRequired: boolean;
  defaultValue?: string | number | boolean;
  lastUpdated?: string;
  updatedBy?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AiSettingsService {
  private apiUrl = `${environment.apiUrl}/v1/admin/ai-settings`;

  constructor(private http: HttpClient) { }

  /**
   * Get all AI settings
   */
  getAllSettings(): Observable<AiSetting[]> {
    return this.http.get<AiSetting[]>(this.apiUrl);
  }

  /**
   * Get AI setting by key
   */
  getSetting(key: string): Observable<AiSetting> {
    return this.http.get<AiSetting>(`${this.apiUrl}/${key}`);
  }

  /**
   * Update an AI setting
   */
  updateSetting(key: string, value: string | number | boolean): Observable<AiSetting> {
    return this.http.put<AiSetting>(`${this.apiUrl}/${key}`, { value });
  }

  /**
   * Reset an AI setting to its default value
   */
  resetSetting(key: string): Observable<AiSetting> {
    return this.http.post<AiSetting>(`${this.apiUrl}/${key}/reset`, {});
  }

  /**
   * Get AI settings by category
   */
  getSettingsByCategory(category: string): Observable<AiSetting[]> {
    return this.http.get<AiSetting[]>(`${this.apiUrl}`, {
      params: { category }
    });
  }

  /**
   * Get all available categories
   */
  getCategories(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/categories`);
  }

  /**
   * Convert value to appropriate type based on dataType
   */
  convertValue(value: string, dataType: 'string' | 'number' | 'boolean'): string | number | boolean {
    if (dataType === 'number') {
      return parseFloat(value);
    } else if (dataType === 'boolean') {
      return value.toLowerCase() === 'true';
    } else {
      return value;
    }
  }
}