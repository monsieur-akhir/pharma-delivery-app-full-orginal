import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { eq, and, ilike, or, count, asc, desc, sql, inArray, gt } from 'drizzle-orm';
import { 
  pharmacies, 
  pharmacy_staff, 
  pharmacy_medicines,
  users,
  type Pharmacy, 
  type InsertPharmacy,
  pharmacyStatusEnum
} from '../../../shared/schema';

@Injectable()
export class PharmaciesService {
  private readonly logger = new Logger(PharmaciesService.name);
  private readonly sortFieldMapping = {
    name: pharmacies.name,
    address: pharmacies.address,
    status: pharmacies.status,
    createdAt: pharmacies.created_at,
    updatedAt: pharmacies.updated_at,
  } as const;

  constructor(private readonly databaseService: DatabaseService) {}

  async findAll(
    query?: string,
    page = 0,
    limit = 10,
    sortField = 'name',
    sortOrder: 'asc' | 'desc' = 'asc',
    status?: string
  ): Promise<{ items: Pharmacy[]; total: number }> {
    this.logger.log(`findAll called with query=${query}, page=${page}, limit=${limit}`);

    try {
      // Build where conditions
      const whereConditions = [];
      if (query) {
        whereConditions.push(
          or(
            ilike(pharmacies.name, `%${query}%`),
            ilike(pharmacies.address, `%${query}%`)
          )
        );
      }
      if (status && Object.values(pharmacyStatusEnum.enumValues).includes(status as any)) {
        whereConditions.push(eq(pharmacies.status, status));
      }

      // Get total count in parallel with main query
      const [totalResult, items] = await Promise.all([
        this.databaseService.db
          .select({ count: count() })
          .from(pharmacies)
          .where(whereConditions.length > 0 ? and(...whereConditions) : undefined),
        
        this.databaseService.db
          .select()
          .from(pharmacies)
          .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
          .orderBy(
            sortOrder === 'asc' 
              ? asc(this.sortFieldMapping[sortField] || pharmacies.name)
              : desc(this.sortFieldMapping[sortField] || pharmacies.name)
          )
          .limit(limit)
          .offset(page * limit)
      ]);

      const total = totalResult[0]?.count ?? 0;

      // Optimized counting using a single query for all pharmacies
      const pharmacyIds = items.map(p => p.id);
      const [medicineCounts, staffCounts] = await Promise.all([
        pharmacyIds.length > 0 
          ? this.databaseService.db
              .select({
                pharmacy_id: pharmacy_medicines.pharmacy_id,
                count: count()
              })
              .from(pharmacy_medicines)
              .where(inArray(pharmacy_medicines.pharmacy_id, pharmacyIds))
              .groupBy(pharmacy_medicines.pharmacy_id)
          : Promise.resolve([]),
          
        pharmacyIds.length > 0
          ? this.databaseService.db
              .select({
                pharmacy_id: pharmacy_staff.pharmacy_id,
                count: count()
              })
              .from(pharmacy_staff)
              .where(inArray(pharmacy_staff.pharmacy_id, pharmacyIds))
              .groupBy(pharmacy_staff.pharmacy_id)
          : Promise.resolve([])
      ]);

      // Create lookup maps for counts
      const medicineCountMap = new Map(medicineCounts.map(mc => [mc.pharmacy_id, mc.count]));
      const staffCountMap = new Map(staffCounts.map(sc => [sc.pharmacy_id, sc.count]));

      // Enhance items with counts
      const enhancedItems = items.map(pharmacy => ({
        ...pharmacy,
        medicineCount: medicineCountMap.get(pharmacy.id) ?? 0,
        staffCount: staffCountMap.get(pharmacy.id) ?? 0
      }));

      return { items: enhancedItems, total };
    } catch (error) {
      this.logger.error('Error in findAll', error.stack);
      throw error;
    }
  }

  async getPharmacyStats() {
    this.logger.log('Calculating pharmacy stats');
    try {
      const statuses = Object.values(pharmacyStatusEnum.enumValues) as string[];
      
      // Single query for all stats
      const statsQuery = await this.databaseService.db
        .select({
          status: pharmacies.status,
          count: count()
        })
        .from(pharmacies)
        .groupBy(pharmacies.status);

      const stats = Object.fromEntries(
        statuses.map(status => [
          status.toLowerCase(),
          statsQuery.find(sq => sq.status === status)?.count ?? 0
        ])
      );

      const total = statsQuery.reduce((sum, item) => sum + item.count, 0);

      return { total, ...stats };
    } catch (error) {
      this.logger.error('Error in getPharmacyStats', error.stack);
      throw error;
    }
  }

  async findById(id: number): Promise<Pharmacy | undefined> {
    this.logger.log(`findById called with id=${id}`);
    try {
      const [pharmacy] = await this.databaseService.db
        .select()
        .from(pharmacies)
        .where(eq(pharmacies.id, id))
        .limit(1);

      if (!pharmacy) return undefined;

      // Get counts in parallel
      const [medicineCount, staffCount] = await Promise.all([
        this.getMedicineCount(id),
        this.getStaffCount(id)
      ]);

      return { ...pharmacy, medicineCount, staffCount };
    } catch (error) {
      this.logger.error('Error in findById', error.stack);
      throw error;
    }
  }

  private async getMedicineCount(pharmacyId: number): Promise<number> {
    try {
      const [result] = await this.databaseService.db
        .select({ count: count() })
        .from(pharmacy_medicines)
        .where(eq(pharmacy_medicines.pharmacy_id, pharmacyId));
      return result?.count ?? 0;
    } catch (error) {
      this.logger.error('Error in getMedicineCount', error.stack);
      throw error;
    }
  }

  private async getStaffCount(pharmacyId: number): Promise<number> {
    try {
      const [result] = await this.databaseService.db
        .select({ count: count() })
        .from(pharmacy_staff)
        .where(eq(pharmacy_staff.pharmacy_id, pharmacyId));
      return result?.count ?? 0;
    } catch (error) {
      this.logger.error('Error in getStaffCount', error.stack);
      throw error;
    }
  }

  async findByProximity(lat: number, lng: number, radius = 5) {
    this.logger.log(`findByProximity called with lat=${lat}, lng=${lng}, radius=${radius}`);
    
    try {
      // Use PostgreSQL earthdistance or PostGIS if available for better performance
      const allPharmacies = await this.databaseService.db
        .select()
        .from(pharmacies)
        .where(
          and(
            eq(pharmacies.is_active, true),
            sql`earth_box(ll_to_earth(${lat}, ${lng}), ${radius * 1000}) @> ll_to_earth(pharmacies.location)`
          )
        );

      // If you don't have PostGIS, use this fallback (less performant)
      /*
      const allPharmacies = await this.databaseService.db
        .select()
        .from(pharmacies)
        .where(eq(pharmacies.is_active, true));

      const nearby = allPharmacies.filter(pharmacy => {
        if (!pharmacy.location) return false;
        return this.calculateDistance(lat, lng, pharmacy.location.lat, pharmacy.location.lng) <= radius;
      });
      */

      return allPharmacies;
    } catch (error) {
      this.logger.error('Error in findByProximity', error.stack);
      throw error;
    }
  }

  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const toRad = (d: number) => (d * Math.PI) / 180;
    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
    return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  async create(pharmacyData: InsertPharmacy): Promise<Pharmacy> {
    try {
      const [newPharmacy] = await this.databaseService.db
        .insert(pharmacies)
        .values({
          ...pharmacyData,
          created_at: new Date(),
          updated_at: new Date()
        })
        .returning();
      
      this.logger.log(`Created pharmacy with id=${newPharmacy.id}`);
      return newPharmacy;
    } catch (error) {
      this.logger.error('Error in create', error.stack);
      throw error;
    }
  }

  async update(
    id: number,
    pharmacyData: Partial<InsertPharmacy>
  ): Promise<Pharmacy> {
    try {
      const [updated] = await this.databaseService.db
        .update(pharmacies)
        .set({ 
          ...pharmacyData, 
          updated_at: new Date() 
        })
        .where(eq(pharmacies.id, id))
        .returning();
      
      this.logger.log(`Updated pharmacy id=${updated.id}`);
      return updated;
    } catch (error) {
      this.logger.error('Error in update', error.stack);
      throw error;
    }
  }

  async updateStatus(
    id: number,
    status: typeof pharmacyStatusEnum.enumValues[number],
    reason?: string
  ): Promise<Pharmacy> {
    try {
      const updateData = { 
        status, 
        updated_at: new Date(),
        ...(reason && { rejection_reason: reason })
      };

      const [updated] = await this.databaseService.db
        .update(pharmacies)
        .set(updateData)
        .where(eq(pharmacies.id, id))
        .returning();
      
      this.logger.log(`Status updated for pharmacy id=${updated.id}`);
      return updated;
    } catch (error) {
      this.logger.error('Error in updateStatus', error.stack);
      throw error;
    }
  }

  async delete(id: number): Promise<boolean> {
    try {
      const result = await this.databaseService.db
        .delete(pharmacies)
        .where(eq(pharmacies.id, id))
        .returning({ id: pharmacies.id });
      
      return result.length > 0;
    } catch (error) {
      this.logger.error('Error in delete', error.stack);
      throw error;
    }
  }

  async getPharmacyStaff(pharmacyId: number) {
    try {
      return await this.databaseService.db
        .select({
          id: users.id,
          username: users.username,
          email: users.email,
          phone: users.phone,
          role: users.role,
          profile_image: users.profile_image,
          staff_role: pharmacy_staff.role,
          position: pharmacy_staff.position,
          staff_id: pharmacy_staff.id,
        })
        .from(pharmacy_staff)
        .innerJoin(users, eq(pharmacy_staff.user_id, users.id))
        .where(eq(pharmacy_staff.pharmacy_id, pharmacyId));
    } catch (error) {
      this.logger.error('Error in getPharmacyStaff', error.stack);
      throw error;
    }
  }

  async addStaffMember(
    pharmacyId: number,
    userId: number,
    staffRole: string,
    position?: string
  ) {
    try {
      const [result] = await this.databaseService.db
        .insert(pharmacy_staff)
        .values({
          pharmacy_id: pharmacyId,
          user_id: userId,
          role: staffRole,
          position,
          created_at: new Date(),
        })
        .returning();
      
      this.logger.log(`Added staff id=${result.id}`);
      return result;
    } catch (error) {
      this.logger.error('Error in addStaffMember', error.stack);
      throw error;
    }
  }

  async removeStaffMember(pharmacyId: number, staffId: number) {
    try {
      const result = await this.databaseService.db
        .delete(pharmacy_staff)
        .where(
          and(
            eq(pharmacy_staff.pharmacy_id, pharmacyId),
            eq(pharmacy_staff.id, staffId)
          )
        )
        .returning({ id: pharmacy_staff.id });
      
      return result.length > 0;
    } catch (error) {
      this.logger.error('Error in removeStaffMember', error.stack);
      throw error;
    }
  }

  async getPharmaciesByMedicine(medicineId: number) {
    try {
      return await this.databaseService.db
        .select({
          id: pharmacies.id,
          name: pharmacies.name,
          address: pharmacies.address,
          location: pharmacies.location,
          phone: pharmacies.phone,
          email: pharmacies.email,
          website: pharmacies.website,
          is_24_hours: pharmacies.is_24_hours,
          image_url: pharmacies.image_url,
          price: pharmacy_medicines.price,
          stockQuantity: pharmacy_medicines.stock,
        })
        .from(pharmacies)
        .innerJoin(
          pharmacy_medicines,
          and(
            eq(pharmacies.id, pharmacy_medicines.pharmacy_id),
            eq(pharmacy_medicines.medicine_id, medicineId)
          )
        )
        .where(
          and(
            eq(pharmacies.is_active, true),
            gt(pharmacy_medicines.stock, 0)
          )
        )
        .orderBy(asc(pharmacy_medicines.price));
    } catch (error) {
      this.logger.error('Error in getPharmaciesByMedicine', error.stack);
      throw error;
    }
  }
}