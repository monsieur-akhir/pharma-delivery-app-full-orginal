import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { desc, eq, and, like, sql } from 'drizzle-orm';
import { SystemLog, CreateSystemLogDto } from '../../interfaces/system-log.interface';
import { system_logs } from '../../interfaces/schema-references';

@Injectable()
export class SystemLogsService {
  private readonly logger = new Logger(SystemLogsService.name);

  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * Create a new system log entry
   */
  async createLogEntry(logEntry: CreateSystemLogDto): Promise<SystemLog> {
    try {
      const db = this.databaseService.db;
      const [createdLog] = await db.insert(system_logs).values(logEntry).returning();
      // Ensure level is cast to the correct type
      const typedLog: SystemLog = {
        ...createdLog,
        level: createdLog.level as 'INFO' | 'WARNING' | 'ERROR' | 'DEBUG'
      };
      
      return typedLog;
    } catch (error) {
      this.logger.error(`Failed to create log entry: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get paginated system logs
   */
  async getLogs(page = 1, limit = 20, filter?: string): Promise<{ logs: SystemLog[]; total: number }> {
    try {
      const db = this.databaseService.db;
      const offset = (page - 1) * limit;

      // Apply filters if provided - using SQL directly to avoid type issues
      let logs;
      let total = 0;
      
      if (filter) {
        // Get filtered count for pagination
        const countResult = await db
          .select({ count: sql<number>`count(*)` })
          .from(system_logs)
          .where(like(system_logs.action, `%${filter}%`))
          .execute();
        
        total = Number(countResult[0]?.count) || 0;
        
        // Get filtered logs
        logs = await db
          .select()
          .from(system_logs)
          .where(like(system_logs.action, `%${filter}%`))
          .orderBy(desc(system_logs.created_at))
          .limit(limit)
          .offset(offset)
          .execute();
      } else {
        // Get total count for pagination first
        const countResult = await db
          .select({ count: sql<number>`count(*)` })
          .from(system_logs)
          .execute();
        
        total = Number(countResult[0]?.count) || 0;
        
        // Get paginated results
        logs = await db
          .select()
          .from(system_logs)
          .orderBy(desc(system_logs.created_at))
          .limit(limit)
          .offset(offset)
          .execute();
      }

      // Ensure level is cast to the correct type
      const typedLogs: SystemLog[] = logs.map(log => ({
        ...log,
        level: log.level as 'INFO' | 'WARNING' | 'ERROR' | 'DEBUG'
      }));
      
      return { logs: typedLogs, total };
    } catch (error) {
      this.logger.error(`Failed to get logs: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get logs for a specific entity
   */
  async getEntityLogs(entityType: string, entityId: number): Promise<SystemLog[]> {
    try {
      const db = this.databaseService.db;
      
      // Use raw SQL condition to avoid type issues with and() operator
      const logs = await db
        .select()
        .from(system_logs)
        .where(sql`${system_logs.entity} = ${entityType} AND ${system_logs.entity_id} = ${entityId}`)
        .orderBy(desc(system_logs.created_at))
        .execute();

      // Ensure level is cast to the correct type
      const typedLogs: SystemLog[] = logs.map(log => ({
        ...log,
        level: log.level as 'INFO' | 'WARNING' | 'ERROR' | 'DEBUG'
      }));
      
      return typedLogs;
    } catch (error) {
      this.logger.error(`Failed to get entity logs: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Delete logs older than specified days
   */
  async deleteOldLogs(days = 90): Promise<number> {
    try {
      const db = this.databaseService.db;
      
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      
      const result = await db
        .delete(system_logs)
        .where(
          sql`${system_logs.created_at} < ${cutoffDate}`
        )
        .returning({ id: system_logs.id });

      return result.length;
    } catch (error) {
      this.logger.error(`Failed to delete old logs: ${error.message}`, error.stack);
      throw error;
    }
  }
}