import { Controller, Get } from '@nestjs/common';
import { HealthCheckService, HttpHealthIndicator, HealthCheck, DiskHealthIndicator, MemoryHealthIndicator } from '@nestjs/terminus';
import { DatabaseService } from '../database/database.service';
import { sql } from 'drizzle-orm';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private http: HttpHealthIndicator,
    private disk: DiskHealthIndicator,
    private memory: MemoryHealthIndicator,
    private readonly databaseService: DatabaseService,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      // API health check - comment out for now as it might cause circular reference
      // () => this.http.pingCheck('nestjs-api', 'http://localhost:8000/api'),
      
      // Disk health
      () => this.disk.checkStorage('storage', { path: '/', thresholdPercent: 0.9 }),
      
      // Memory health
      () => this.memory.checkHeap('memory_heap', 300 * 1024 * 1024), // 300MB
      () => this.memory.checkRSS('memory_rss', 300 * 1024 * 1024), // 300MB
      
      // Custom database health check using Drizzle
      async () => {
        try {
          // Check if database connection is working
          await this.databaseService.db.execute(sql`SELECT 1`);
          return {
            database: {
              status: 'up',
            },
          };
        } catch (error) {
          return {
            database: {
              status: 'down',
              message: error.message,
            },
          };
        }
      },
    ]);
  }
}