import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { pharmacies, system_logs, pharmacyStatusEnum } from '../../../../shared/src/schema';
import { eq, and, or, like, desc, sql } from 'drizzle-orm';

// Define log levels for system_logs table
type LogLevel = 'INFO' | 'WARNING' | 'ERROR' | 'DEBUG';
// Define pharmacy status type
type PharmacyStatus = typeof pharmacyStatusEnum.enumValues[number];

@Injectable()
export class PharmacyValidationService {
  private readonly logger = new Logger(PharmacyValidationService.name);

  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * Get all pharmacies pending validation
   */
  async getPendingPharmacies(page = 1, limit = 10) {
    try {
      const db = this.databaseService.db;
      const offset = (page - 1) * limit;

      // Get pending pharmacies
      const pendingPharmacies = await db
        .select()
        .from(pharmacies)
        .where(eq(pharmacies.status, 'PENDING'))
        .orderBy(desc(pharmacies.created_at))
        .limit(limit)
        .offset(offset);

      // Get total count for pagination
      const totalResult = await db
        .select({ count: sql`count(*)` })
        .from(pharmacies)
        .where(eq(pharmacies.status, 'PENDING'));

      const total = Number(totalResult[0]?.count || 0);

      return {
        pharmacies: pendingPharmacies,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      this.logger.error(`Failed to get pending pharmacies: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get pharmacy details for validation
   */
  async getPharmacyForValidation(pharmacyId: number) {
    try {
      const db = this.databaseService.db;
      
      const pharmacy = await db
        .select()
        .from(pharmacies)
        .where(eq(pharmacies.id, pharmacyId))
        .limit(1);

      if (!pharmacy || pharmacy.length === 0) {
        throw new NotFoundException(`Pharmacy with ID ${pharmacyId} not found`);
      }

      return pharmacy[0];
    } catch (error) {
      this.logger.error(`Failed to get pharmacy for validation: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Approve a pharmacy
   */
  async approvePharmacy(pharmacyId: number, adminId: number, notes?: string) {
    try {
      const db = this.databaseService.db;
      
      // Verify pharmacy exists and is pending
      const pharmacy = await this.getPharmacyForValidation(pharmacyId);
      
      if (pharmacy.status !== 'PENDING') {
        throw new BadRequestException(`Pharmacy with ID ${pharmacyId} is not in PENDING status`);
      }
      
      // Update pharmacy status
      const [updatedPharmacy] = await db
        .update(pharmacies)
        .set({
          status: 'APPROVED',
          is_verified: true,
          verified_by: adminId,
          verified_at: new Date(),
          updated_at: new Date()
        })
        .where(eq(pharmacies.id, pharmacyId))
        .returning();
      
      // Log the action
      await db.insert(system_logs).values({
        action: 'APPROVE',
        entity: 'pharmacy',
        entity_id: pharmacyId,
        details: { notes },
        user_id: adminId,
        created_at: new Date(),
        level: 'INFO'
      });
      
      return updatedPharmacy;
    } catch (error) {
      this.logger.error(`Failed to approve pharmacy: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Reject a pharmacy
   */
  async rejectPharmacy(pharmacyId: number, adminId: number, reason: string) {
    try {
      const db = this.databaseService.db;
      
      // Verify pharmacy exists and is pending
      const pharmacy = await this.getPharmacyForValidation(pharmacyId);
      
      if (pharmacy.status !== 'PENDING') {
        throw new BadRequestException(`Pharmacy with ID ${pharmacyId} is not in PENDING status`);
      }
      
      if (!reason) {
        throw new BadRequestException('Rejection reason is required');
      }
      
      // Update pharmacy status
      const [updatedPharmacy] = await db
        .update(pharmacies)
        .set({
          status: 'REJECTED',
          rejection_reason: reason,
          is_verified: false,
          updated_at: new Date()
        })
        .where(eq(pharmacies.id, pharmacyId))
        .returning();
      
      // Log the action
      await db.insert(system_logs).values({
        action: 'REJECT',
        entity: 'pharmacy',
        entity_id: pharmacyId,
        details: { reason },
        user_id: adminId,
        created_at: new Date(),
        level: 'WARNING'
      });
      
      return updatedPharmacy;
    } catch (error) {
      this.logger.error(`Failed to reject pharmacy: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Request additional information for a pharmacy
   */
  async requestMoreInformation(pharmacyId: number, adminId: number, requestedInfo: string) {
    try {
      const db = this.databaseService.db;
      
      // Verify pharmacy exists and is pending
      const pharmacy = await this.getPharmacyForValidation(pharmacyId);
      
      if (pharmacy.status !== 'PENDING') {
        throw new BadRequestException(`Pharmacy with ID ${pharmacyId} is not in PENDING status`);
      }
      
      if (!requestedInfo) {
        throw new BadRequestException('Information request details are required');
      }
      
      // Update pharmacy status to pending with additional info
      const [updatedPharmacy] = await db
        .update(pharmacies)
        .set({
          status: 'PENDING_INFO',
          additional_info_required: requestedInfo,
          updated_at: new Date()
        })
        .where(eq(pharmacies.id, pharmacyId))
        .returning();
      
      // Log the action
      await db.insert(system_logs).values({
        action: 'REQUEST_INFO',
        entity: 'pharmacy',
        entity_id: pharmacyId,
        details: { requestedInfo },
        user_id: adminId,
        created_at: new Date(),
        level: 'INFO'
      });
      
      return updatedPharmacy;
    } catch (error) {
      this.logger.error(`Failed to request more information: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Search pharmacies by validation status and search term
   */
  async searchPharmacies(status?: PharmacyStatus, term?: string, page = 1, limit = 10) {
    try {
      const db = this.databaseService.db;
      const offset = (page - 1) * limit;
      
      let query = db.select().from(pharmacies);
      
      // Filter by status if provided
      if (status) {
        // Using type assertion to handle Drizzle type issue
        query = query.where(eq(pharmacies.status, status)) as any;
      }
      
      // Add search term if provided
      if (term) {
        // Using type assertion to handle Drizzle type issue
        query = query.where(
          or(
            like(pharmacies.name, `%${term}%`),
            like(pharmacies.address, `%${term}%`),
            like(pharmacies.email, `%${term}%`),
            like(pharmacies.phone, `%${term}%`)
          )
        ) as any;
      }
      
      // Get paginated results
      const results = await query
        .orderBy(desc(pharmacies.created_at))
        .limit(limit)
        .offset(offset);
      
      // Get total count for pagination
      const totalResult = await db
        .select({ count: sql`count(*)` })
        .from(pharmacies)
        .where(status ? eq(pharmacies.status, status) : undefined);

      const total = Number(totalResult[0]?.count || 0);
      
      return {
        pharmacies: results,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      this.logger.error(`Failed to search pharmacies: ${error.message}`, error.stack);
      throw error;
    }
  }
}