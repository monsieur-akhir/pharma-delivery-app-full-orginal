import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool, QueryResult } from 'pg';
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../../shared/src/schema'; // Adjusted path to schema

@Injectable()
export class DatabaseService implements OnModuleDestroy {
  private readonly logger = new Logger(DatabaseService.name);
  private readonly pool: Pool;
  public db: NodePgDatabase<typeof schema>; // Expose Drizzle instance

  constructor(private readonly configService: ConfigService) {
    const connectionString = this.configService.get<string>('DATABASE_URL');
    
    if (!connectionString) {
      this.logger.error('DATABASE_URL environment variable is not set');
      throw new Error('DATABASE_URL environment variable is not set');
    }
    
    this.pool = new Pool({
      connectionString,
      ssl: this.configService.get<string>('NODE_ENV') === 'production' 
        ? { rejectUnauthorized: false } 
        : false,
    });

    this.db = drizzle(this.pool, { schema }); // Initialize Drizzle
    
    this.logger.log('Database service initialized and Drizzle ORM connected');
    
    // Test the connection
    this.pool.query('SELECT NOW()')
      .then(() => this.logger.log('Successfully connected to the database'))
      .catch(err => this.logger.error(`Failed to connect to the database: ${err.message}`));
  }

  /**
   * Execute a SQL query on the database
   */
  async query(text: string, params?: any[]): Promise<QueryResult> {
    try {
      const start = Date.now();
      const result = await this.pool.query(text, params);
      const duration = Date.now() - start;
      
      this.logger.debug(`Executed query: ${text}, Duration: ${duration}ms, Rows: ${result.rowCount}`);
      
      return result;
    } catch (error) {
      this.logger.error(`Database query error: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get pharmacy statistics
   */
  async getPharmacyStats() {
    try {
      console.log('Executing getPharmacyStats in DatabaseService');
      const totalResult = await this.query('SELECT COUNT(*) FROM pharmacies');
      const pendingResult = await this.query("SELECT COUNT(*) FROM pharmacies WHERE status = 'PENDING'");
      const approvedResult = await this.query("SELECT COUNT(*) FROM pharmacies WHERE status = 'APPROVED'");
      const pendingInfoResult = await this.query("SELECT COUNT(*) FROM pharmacies WHERE status = 'PENDING_INFO'");
      const rejectedResult = await this.query("SELECT COUNT(*) FROM pharmacies WHERE status = 'REJECTED'");
      
      console.log('Stats query results:', { 
        total: totalResult.rows[0], 
        pending: pendingResult.rows[0],
        approved: approvedResult.rows[0],
        pendingInfo: pendingInfoResult.rows[0],
        rejected: rejectedResult.rows[0]
      });
      
      return {
        total: parseInt(totalResult.rows[0].count, 10) || 0,
        pending: parseInt(pendingResult.rows[0].count, 10) || 0,
        approved: parseInt(approvedResult.rows[0].count, 10) || 0,
        pendingInfo: parseInt(pendingInfoResult.rows[0].count, 10) || 0,
        rejected: parseInt(rejectedResult.rows[0].count, 10) || 0
      };
    } catch (error) {
      console.error('Error in getPharmacyStats in DatabaseService:', error);
      throw error;
    }
  }

  /**
   * Get a client from the pool
   */
  async getClient() {
    const client = await this.pool.connect();
    const query = client.query;
    const release = client.release;
    
    // Override the query method to log queries
    const queryWrapper = (...args: any[]) => {
      const lastQuery = args[0];
      this.logger.debug(`Client executing query: ${typeof lastQuery === 'string' ? lastQuery : 'prepared statement'}`);
      return query.apply(client, args);
    };
    
    // Apply the wrapped query method
    client.query = queryWrapper;
    
    // Override the release method to log release
    client.release = () => {
      client.query = query;
      client.release = release;
      return release.apply(client);
    };
    
    return client;
  }

  /**
   * Close the database connection pool
   */
  async onModuleDestroy() {
    await this.pool.end();
    this.logger.log('Database pool has ended');
  }
}