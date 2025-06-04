import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { ai_settings, system_logs } from '../../../../shared/src/schema';
import { eq, and, SQL, sql } from 'drizzle-orm';

@Injectable()
export class AiSettingsService {
  private readonly logger = new Logger(AiSettingsService.name);

  // Define the available AI setting features (these match the 'feature' field in ai_settings table)
  private readonly availableSettings = [
    'prescription_threshold', // Confidence threshold for prescription analysis
    'auto_order_threshold',   // Threshold for automatic supplier orders
    'interaction_warning_level', // Level of warnings for drug interactions
    'ocr_confidence_minimum',  // Minimum confidence for OCR to be accepted
    'default_model_settings',  // Default settings for AI models
    'language_preferences'     // Language preferences for AI interactions
  ];

  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * Get all AI settings (global or for a specific entity)
   */
  async getAllSettings(userId?: number, pharmacyId?: number) {
    try {
      const db = this.databaseService.db;
      
      // Execute a raw SQL query to fetch AI settings - this avoids TypeScript issues
      // with accessing non-existent fields directly on the schema
      const settings = await db.execute(sql`
        SELECT * FROM ai_settings
        WHERE (${userId} IS NOT NULL AND user_id = ${userId})
           OR (${pharmacyId} IS NOT NULL AND pharmacy_id = ${pharmacyId})
           OR (${userId} IS NULL AND ${pharmacyId} IS NULL AND user_id IS NULL AND pharmacy_id IS NULL)
      `);
      
      // Transform to a more friendly format
      const result: Record<string, any> = {};
      
      // Check if settings is an array (it should be in the rows property)
      const settingsArray = Array.isArray(settings) ? settings : 
                          settings.rows ? settings.rows : [];
      
      settingsArray.forEach((setting: any) => {
        result[String(setting.feature)] = setting.configuration;
      });
      
      return result;
    } catch (error) {
      this.logger.error(`Failed to get AI settings: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get a specific AI setting
   */
  async getSetting(key: string, userId?: number, pharmacyId?: number) {
    try {
      const db = this.databaseService.db;
      
      // Validate setting key
      if (!this.availableSettings.includes(key)) {
        throw new NotFoundException(`Setting ${key} does not exist`);
      }
      
      // Execute a raw SQL query to get the specific setting
      const settings = await db.execute(sql`
        SELECT * FROM ai_settings
        WHERE feature = ${key}
          AND ((${userId} IS NOT NULL AND user_id = ${userId})
            OR (${pharmacyId} IS NOT NULL AND pharmacy_id = ${pharmacyId})
            OR (${userId} IS NULL AND ${pharmacyId} IS NULL AND user_id IS NULL AND pharmacy_id IS NULL))
        LIMIT 1
      `);
      
      // Get settings array
      const settingsArray = Array.isArray(settings) ? settings : 
                          settings.rows ? settings.rows : [];
      
      if (settingsArray.length === 0) {
        // If setting doesn't exist, return default values
        return this.getDefaultSettingValue(key);
      }
      
      return settingsArray[0]?.configuration;
    } catch (error) {
      this.logger.error(`Failed to get AI setting: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Update or create an AI setting
   */
  async updateSetting(key: string, value: any, adminId: number, userId?: number, pharmacyId?: number) {
    try {
      const db = this.databaseService.db;
      
      // Validate setting key
      if (!this.availableSettings.includes(key)) {
        throw new NotFoundException(`Setting ${key} does not exist`);
      }
      
      // First check if the setting exists
      const existing = await db.execute(sql`
        SELECT * FROM ai_settings
        WHERE feature = ${key}
          AND ((${userId} IS NOT NULL AND user_id = ${userId})
            OR (${pharmacyId} IS NOT NULL AND pharmacy_id = ${pharmacyId})
            OR (${userId} IS NULL AND ${pharmacyId} IS NULL AND user_id IS NULL AND pharmacy_id IS NULL))
        LIMIT 1
      `);
      
      // Get existing array
      const existingArray = Array.isArray(existing) ? existing : 
                        existing.rows ? existing.rows : [];
      
      let result;
      const now = new Date();
      
      // If setting exists, update it
      if (existingArray.length > 0) {
        result = await db.execute(sql`
          UPDATE ai_settings
          SET configuration = ${value}, updated_at = ${now}
          WHERE id = ${existingArray[0]?.id || 0}
          RETURNING *
        `);
      } else {
        // Otherwise, create a new setting
        result = await db.execute(sql`
          INSERT INTO ai_settings (feature, is_enabled, configuration, user_id, pharmacy_id, created_at, updated_at)
          VALUES (${key}, true, ${value}, ${userId || null}, ${pharmacyId || null}, ${now}, ${now})
          RETURNING *
        `);
      }
      
      // Get result array
      const resultArray = Array.isArray(result) ? result : 
                       result.rows ? result.rows : [];
      
      // Log the action
      const entityType = userId ? 'user' : pharmacyId ? 'pharmacy' : 'global';
      const entityId = userId || pharmacyId || null;
      
      await db.execute(sql`
        INSERT INTO system_logs (action, entity, entity_id, user_id, details, created_at, level)
        VALUES (
          ${existingArray.length > 0 ? 'UPDATE' : 'CREATE'},
          ${'ai_setting'},
          ${resultArray[0]?.id || 0},
          ${adminId},
          ${`AI setting ${key} ${existingArray.length > 0 ? 'updated' : 'created'} for ${entityType}${entityId ? ' ' + entityId : ''}`},
          ${now},
          ${'INFO'}
        )
      `);
      
      return resultArray[0];
    } catch (error) {
      this.logger.error(`Failed to update AI setting: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Delete an AI setting
   */
  async deleteSetting(key: string, adminId: number, userId?: number, pharmacyId?: number) {
    try {
      const db = this.databaseService.db;
      
      // Validate setting key
      if (!this.availableSettings.includes(key)) {
        throw new NotFoundException(`Setting ${key} does not exist`);
      }
      
      // First, get the setting to confirm it exists and to have its ID for logging
      const existing = await db.execute(sql`
        SELECT * FROM ai_settings
        WHERE feature = ${key}
          AND ((${userId} IS NOT NULL AND user_id = ${userId})
            OR (${pharmacyId} IS NOT NULL AND pharmacy_id = ${pharmacyId})
            OR (${userId} IS NULL AND ${pharmacyId} IS NULL AND user_id IS NULL AND pharmacy_id IS NULL))
        LIMIT 1
      `);
      
      // Get existing array
      const existingArray = Array.isArray(existing) ? existing : 
                          existing.rows ? existing.rows : [];
      
      if (existingArray.length === 0) {
        throw new NotFoundException(`Setting ${key} not found`);
      }
      
      // Delete the setting
      const result = await db.execute(sql`
        DELETE FROM ai_settings
        WHERE id = ${existingArray[0].id}
        RETURNING *
      `);
      
      // Log the action
      const entityType = userId ? 'user' : pharmacyId ? 'pharmacy' : 'global';
      const entityId = userId || pharmacyId || null;
      const now = new Date();
      
      await db.execute(sql`
        INSERT INTO system_logs (action, entity, entity_id, user_id, details, created_at, level)
        VALUES (
          ${'DELETE'},
          ${'ai_setting'},
          ${existingArray[0].id},
          ${adminId},
          ${`AI setting ${key} deleted for ${entityType}${entityId ? ' ' + entityId : ''}`},
          ${now},
          ${'INFO'}
        )
      `);
      
      return { success: true, message: `Setting ${key} deleted successfully` };
    } catch (error) {
      this.logger.error(`Failed to delete AI setting: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Reset an AI setting to default value
   */
  async resetToDefault(key: string, adminId: number, userId?: number, pharmacyId?: number) {
    try {
      // Get default value for this setting
      const defaultValue = this.getDefaultSettingValue(key);
      
      // Update setting to default value
      return this.updateSetting(key, defaultValue, adminId, userId, pharmacyId);
    } catch (error) {
      this.logger.error(`Failed to reset AI setting: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get default values for settings
   */
  private getDefaultSettingValue(key: string) {
    switch (key) {
      case 'prescription_threshold':
        return { confidence: 0.75, require_review_below: 0.6 };
      case 'auto_order_threshold':
        return { min_stock_percentage: 20, auto_order_enabled: true };
      case 'interaction_warning_level':
        return { level: 'MEDIUM', include_minor: false };
      case 'ocr_confidence_minimum':
        return { minimum: 0.80, highlight_below: 0.90 };
      case 'default_model_settings':
        return {
          model: 'gpt-4o',
          temperature: 0.3,
          max_tokens: 500
        };
      case 'language_preferences':
        return {
          primary: 'en',
          supported: ['en', 'fr', 'es']
        };
      default:
        return {};
    }
  }
}