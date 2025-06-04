import { Injectable, Logger, NotFoundException, BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { eq, like, or, and, desc, sql } from 'drizzle-orm';
import { Users, CreateUserDto, UpdateUserDto } from '../../interfaces/user.interface';
import { SystemLog, CreateSystemLogDto } from '../../interfaces/system-log.interface';
import { users, system_logs, userRoleEnum } from '../../../../shared/src/schema';

@Injectable()
export class UserManagementService {
  private readonly logger = new Logger(UserManagementService.name);

  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * Get paginated list of users with optional filtering
   */
  async getUsers(page = 1, limit = 20, role?: string, search?: string) {
    try {
      const db = this.databaseService.db;
      const offset = (page - 1) * limit;
      
      // We'll use sql templates directly instead of building a query

      // Use SQL templates for all raw queries
      let countQuery;
      
      // Create the WHERE clause with sql templates to ensure proper escaping
      if (role && search) {
        countQuery = sql`
          SELECT COUNT(*) as count 
          FROM users 
          WHERE role = ${role} 
          AND (username ILIKE ${'%' + search + '%'} 
               OR email ILIKE ${'%' + search + '%'} 
               OR phone ILIKE ${'%' + search + '%'})
        `;
      } else if (role) {
        countQuery = sql`
          SELECT COUNT(*) as count 
          FROM users 
          WHERE role = ${role}
        `;
      } else if (search) {
        countQuery = sql`
          SELECT COUNT(*) as count 
          FROM users 
          WHERE username ILIKE ${'%' + search + '%'} 
            OR email ILIKE ${'%' + search + '%'} 
            OR phone ILIKE ${'%' + search + '%'}
        `;
      } else {
        countQuery = sql`SELECT COUNT(*) as count FROM users`;
      }
      
      // Execute the count query
      const countResult = await db.execute(countQuery);
      
      // Extract count from result
      const countArray = Array.isArray(countResult) ? countResult : 
                   countResult.rows ? countResult.rows : [];
      const count = Number(countArray[0]?.count || 0);

      // Get paginated results with SQL templates
      let selectQuery;
      
      // Use the same SQL template approach as for the count query
      if (role && search) {
        selectQuery = sql`
          SELECT * FROM users
          WHERE role = ${role}
          AND (username ILIKE ${'%' + search + '%'} 
               OR email ILIKE ${'%' + search + '%'} 
               OR phone ILIKE ${'%' + search + '%'})
          ORDER BY created_at DESC
          LIMIT ${limit} OFFSET ${offset}
        `;
      } else if (role) {
        selectQuery = sql`
          SELECT * FROM users
          WHERE role = ${role}
          ORDER BY created_at DESC
          LIMIT ${limit} OFFSET ${offset}
        `;
      } else if (search) {
        selectQuery = sql`
          SELECT * FROM users
          WHERE username ILIKE ${'%' + search + '%'} 
            OR email ILIKE ${'%' + search + '%'} 
            OR phone ILIKE ${'%' + search + '%'}
          ORDER BY created_at DESC
          LIMIT ${limit} OFFSET ${offset}
        `;
      } else {
        selectQuery = sql`
          SELECT * FROM users
          ORDER BY created_at DESC
          LIMIT ${limit} OFFSET ${offset}
        `;
      }
      
      const userList = await db.execute(selectQuery);

      // Get the result rows
      const userResults = Array.isArray(userList) ? userList : 
                         userList.rows ? userList.rows : [];
                  
      return {
        users: userResults,
        total: Number(count),
        page,
        limit,
        totalPages: Math.ceil(Number(count) / limit)
      };
    } catch (error) {
      this.logger.error(`Failed to get users: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get a user by ID
   */
  async getUserById(userId: number): Promise<Users> {
    try {
      const db = this.databaseService.db;

      const user = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!user || user.length === 0) {
        throw new NotFoundException(`User with ID ${userId} not found`);
      }

      return user[0];
    } catch (error) {
      this.logger.error(`Failed to get user by ID: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Create a new user (admin function)
   */
  async createUser(userData: CreateUserDto, adminId: number): Promise<Users> {
    try {
      const db = this.databaseService.db;

      // Check if username, email, or phone already exists
      const existingUser = await db
        .select()
        .from(users)
        .where(
          or(
            eq(users.username, userData.username),
            eq(users.email, userData.email),
            eq(users.phone, userData.phone)
          )
        )
        .limit(1);

      if (existingUser && existingUser.length > 0) {
        const existing = existingUser[0];
        if (existing.username === userData.username) {
          throw new ConflictException(`Username ${userData.username} is already taken`);
        } else if (existing.email === userData.email) {
          throw new ConflictException(`Email ${userData.email} is already registered`);
        } else if (existing.phone === userData.phone) {
          throw new ConflictException(`Phone number ${userData.phone} is already registered`);
        }
      }

      // Create the user
      // Extract fields from userData that match the schema
      const { username, email, phone, role, address, first_name, last_name, password, is_active } = userData;
      
      // Vérifier si on essaie de créer un SUPER_ADMIN
      if (role === 'SUPER_ADMIN') {
        // Récupérer l'utilisateur admin qui fait la requête
        const adminUser = await db
          .select({ role: users.role })
          .from(users)
          .where(eq(users.id, adminId))
          .limit(1);
          
        // Seul un SUPER_ADMIN peut créer un autre SUPER_ADMIN
        if (!adminUser || adminUser.length === 0 || adminUser[0].role !== 'SUPER_ADMIN') {
          throw new ForbiddenException('Seul un Super Admin peut créer un autre Super Admin');
        }
      }
      
      // Hasher le mot de passe si fourni
      let passwordHash = undefined;
      if (password) {
        const bcrypt = require('bcrypt');
        passwordHash = await bcrypt.hash(password, 10);
      }

      const [createdUser] = await db
        .insert(users)
        .values({
          username,
          phone: phone || '', // Phone is required in the schema
          email,
          role: role as any, // Cast to any to bypass type checking temporarily
          address,
          first_name,
          last_name,
          password_hash: passwordHash,
          is_active: is_active !== undefined ? is_active : true,
          // Let default values handle created_at, updated_at
        })
        .returning();

      // Log the action
      await db.insert(system_logs).values({
        action: 'CREATE',
        entity: 'user',
        entity_id: createdUser.id,
        user_id: adminId,
        details: `User ${createdUser.username} created with role ${createdUser.role}`,
        created_at: new Date()
      });

      return createdUser;
    } catch (error) {
      this.logger.error(`Failed to create user: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Update a user
   */
  async updateUser(userId: number, userData: UpdateUserDto, adminId: number): Promise<Users> {
    try {
      const db = this.databaseService.db;

      // Check if user exists
      const existingUser = await this.getUserById(userId);

      // Check if username, email, or phone already exists (if being updated)
      if (userData.username || userData.email || userData.phone) {
        // Create conditions for fields that exist
        const conditions = [];
        if (userData.username) conditions.push(eq(users.username, userData.username));
        if (userData.email) conditions.push(eq(users.email, userData.email));
        if (userData.phone) conditions.push(eq(users.phone, userData.phone));
        
        // If we have any conditions, proceed with the query
        if (conditions.length > 0) {
          const duplicateCheck = await db
            .select()
            .from(users)
            .where(
              and(
                or(...conditions),
                // Use not equal instead of negation
                sql`${users.id} != ${userId}`
              )
            )
            .limit(1);

          if (duplicateCheck && duplicateCheck.length > 0) {
            const duplicate = duplicateCheck[0];
            if (userData.username && duplicate.username === userData.username) {
              throw new ConflictException(`Username ${userData.username} is already taken`);
            } else if (userData.email && duplicate.email === userData.email) {
              throw new ConflictException(`Email ${userData.email} is already registered`);
            } else if (userData.phone && duplicate.phone === userData.phone) {
              throw new ConflictException(`Phone number ${userData.phone} is already registered`);
            }
          }
        }
      }

      // Update the user
      // Extract and type-cast fields that match the schema
      const updateFields: Record<string, any> = {};
      
      // Only add fields that are present in userData
      if (userData.username) updateFields.username = userData.username;
      if (userData.email !== undefined) updateFields.email = userData.email;
      if (userData.phone) updateFields.phone = userData.phone;
      if (userData.role) updateFields.role = userData.role as any; // Cast to bypass TypeScript checking
      if (userData.address !== undefined) updateFields.address = userData.address;
      if (userData.is_active !== undefined) updateFields.is_active = userData.is_active;
      
      // Always update the updated_at timestamp
      updateFields.updated_at = new Date();
      
      const [updatedUser] = await db
        .update(users)
        .set(updateFields)
        .where(eq(users.id, userId))
        .returning();

      // Log the action
      await db.insert(system_logs).values({
        action: 'UPDATE',
        entity: 'user',
        entity_id: userId,
        user_id: adminId,
        details: `User ${existingUser.username} updated`,
        created_at: new Date()
      });

      return updatedUser;
    } catch (error) {
      this.logger.error(`Failed to update user: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Update a user's role
   */
  async updateUserRole(userId: number, role: string, adminId: number): Promise<Users> {
    try {
      // Validate the role
      const validRoles = ["CUSTOMER", "ADMIN", "PHARMACY_STAFF", "PHARMACIST", "DELIVERY_PERSON"];
      if (!validRoles.includes(role)) {
        throw new BadRequestException(`Invalid role: ${role}. Valid roles are: ${validRoles.join(', ')}`);
      }

      // Get existing user
      const existingUser = await this.getUserById(userId);

      // Don't allow changing the role of the last ADMIN
      if (existingUser.role === 'ADMIN' && role !== 'ADMIN') {
        const adminCount = await this.countUsersByRole('ADMIN');
        if (adminCount <= 1) {
          throw new BadRequestException('Cannot change the role of the last admin user');
        }
      }

      // Update the user's role
      return this.updateUser(userId, { role }, adminId);
    } catch (error) {
      this.logger.error(`Failed to update user role: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Disable a user account
   */
  async disableUser(userId: number, adminId: number, reason?: string): Promise<Users> {
    try {
      const db = this.databaseService.db;

      // Check if user exists
      const existingUser = await this.getUserById(userId);

      // Don't allow disabling the last ADMIN
      if (existingUser.role === 'ADMIN') {
        const adminCount = await this.countUsersByRole('ADMIN');
        if (adminCount <= 1) {
          throw new BadRequestException('Cannot disable the last admin user');
        }
      }

      // Disable the user
      const [disabledUser] = await db
        .update(users)
        .set({
          is_active: false,
          updated_at: new Date()
        })
        .where(eq(users.id, userId))
        .returning();

      // Log the action
      await db.insert(system_logs).values({
        action: 'DISABLE',
        entity: 'user',
        entity_id: userId,
        details: `User ${existingUser.username} disabled${reason ? ': ' + reason : ''}`,
        user_id: adminId,
        created_at: new Date()
      });

      return disabledUser;
    } catch (error) {
      this.logger.error(`Failed to disable user: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Enable a user account
   */
  async enableUser(userId: number, adminId: number): Promise<Users> {
    try {
      const db = this.databaseService.db;

      // Check if user exists
      const existingUser = await this.getUserById(userId);

      // Enable the user
      const [enabledUser] = await db
        .update(users)
        .set({
          is_active: true,
          updated_at: new Date()
        })
        .where(eq(users.id, userId))
        .returning();

      // Log the action
      await db.insert(system_logs).values({
        action: 'ENABLE',
        entity: 'user',
        entity_id: userId,
        details: `User ${existingUser.username} enabled`,
        user_id: adminId,
        created_at: new Date()
      });

      return enabledUser;
    } catch (error) {
      this.logger.error(`Failed to enable user: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Count users by role
   */
  private async countUsersByRole(role: string): Promise<number> {
    try {
      const db = this.databaseService.db;

      // Use raw SQL for counting, as the db.fn approach is causing TypeScript errors
      const result = await db.execute(sql`
        SELECT COUNT(*) as count
        FROM users
        WHERE role = ${role} AND is_active = true
      `);
      
      // Get result array
      const resultArray = Array.isArray(result) ? result : 
                       result.rows ? result.rows : [];
      
      return Number(resultArray[0]?.count || 0);
    } catch (error) {
      this.logger.error(`Failed to count users by role: ${error.message}`, error.stack);
      throw error;
    }
  }
}