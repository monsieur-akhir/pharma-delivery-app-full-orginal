import { Injectable, Logger, NotFoundException, BadRequestException, ForbiddenException, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DatabaseService } from '../database/database.service';
import {
  CreateUserDto,
  UpdateUserDto,
  UserFilterDto,
  ChangePasswordDto,
  UserResponseDto,
  AssignRoleDto, // Added based on controller usage
  UserStatsResponseDto // Added based on controller usage
} from './dto'; // Changed to import from dto/index.ts

// import { User } from './entities/user.entity'; // If you have a User entity
import * as bcrypt from 'bcrypt';
// import { MailService } from '../mail/mail.service'; // If you have a mail service

// Internal User type representing the structure from the database, including password_hash
interface UserEntity {
  id: number;
  email: string;
  username: string;
  phone: string;
  role: string;
  address?: string | null;
  location?: { lat: number; lng: number } | null;
  created_at: Date;
  updated_at: Date;
  is_active: boolean;
  profile_image?: string | null;
  password_hash?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  last_login?: Date | null;
  stripe_customer_id?: string | null;
  stripe_subscription_id?: string | null;
  pharmacy_id?: number | null;
  status?: string | null;
  preferences?: any;
  name?: string | null;
  avatar_url?: string | null;
}

// Helper function to map UserEntity or raw DB result to UserResponseDto
function mapToUserResponseDto(user: any): UserResponseDto {
  if (!user) {
    throw new InternalServerErrorException('Attempted to map an undefined or null user.');
  }
  
  // Combine first_name and last_name for backward compatibility
  const name = user.first_name || user.last_name ? 
    `${user.first_name || ''} ${user.last_name || ''}`.trim() : 
    undefined;
    
  // Ensure all fields expected by UserResponseDto are present, even if null/undefined
  return {
    id: user.id,
    name: name,
    email: user.email,
    username: user.username || undefined,
    phone: user.phone || undefined,
    role: user.role,
    status: user.is_active ? 'ACTIVE' : 'INACTIVE', // Derive status from is_active
    pharmacy_id: user.pharmacy_id === null ? undefined : user.pharmacy_id,
    avatar_url: user.profile_image || undefined, // Map profile_image to avatar_url
    address: user.address || undefined,
    location: user.location || undefined,
    first_name: user.first_name || undefined,
    last_name: user.last_name || undefined,
    is_active: user.is_active,
    last_login: user.last_login || undefined,
    stripe_customer_id: user.stripe_customer_id || undefined,
    stripe_subscription_id: user.stripe_subscription_id || undefined,
    created_at: user.created_at,
    updated_at: user.updated_at,
  };
}


@Injectable()
export class UsersService {
  /**
   * Find a user by ID
   */
  async findById(id: number): Promise<UserResponseDto | null> {
    try {
      const result = await this.databaseService.query(
        'SELECT id, email, username, phone, role, address, location, created_at, updated_at, is_active, profile_image, first_name, last_name, last_login, stripe_customer_id, stripe_subscription_id FROM users WHERE id = $1',
        [id]
      );
      
      if (result.rows.length === 0) {
        return null;
      }
      return mapToUserResponseDto(result.rows[0]);
    } catch (error) {
      this.logger.error(`Error finding user by ID ${id}: ${error.message}`, error.stack);
      throw new InternalServerErrorException(`Could not fetch user by ID: ${error.message}`);
    }
  }

  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly configService: ConfigService,
    // private readonly mailService: MailService, // Inject if needed for resetPassword
  ) {}

  // Internal helper to get the full UserEntity for the currently authenticated user from JWT payload
  private async getCurrentUserEntity(userFromJwt: { id: number }): Promise<UserEntity> {
    const currentUserEntity = await this.findOneInternal(userFromJwt.id);
    if (!currentUserEntity) {
      this.logger.error(`Authenticated user with ID ${userFromJwt.id} not found in database.`);
      throw new ForbiddenException('Authenticated user not found.'); // Or InternalServerErrorException
    }
    return currentUserEntity;
  }

  /**
   * Find a user by ID
   */
  async findOne(id: number): Promise<UserResponseDto> { 
    try {
      const result = await this.databaseService.query(
        'SELECT id, email, username, phone, role, address, location, created_at, updated_at, is_active, profile_image, first_name, last_name, last_login, stripe_customer_id, stripe_subscription_id FROM users WHERE id = $1',
        [id]
      );
      
      if (result.rows.length === 0) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }
      return mapToUserResponseDto(result.rows[0]);
    } catch (error) {
      this.logger.error(`Error finding user ${id}: ${error.message}`);
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(`Could not fetch user: ${error.message}`);
    }
  }

  /**
   * Find a user by email (internal use, returns full entity including password hash)
   */
  async findByEmailInternal(email: string): Promise<UserEntity | null> {
    try {
      const result = await this.databaseService.query(
        'SELECT * FROM users WHERE email = $1', // Fetches all columns including password_hash
        [email]
      );
      
      return result.rows[0] || null;
    } catch (error) {
      this.logger.error(`Error finding user by email ${email}: ${error.message}`);
      // For internal functions, rethrowing might be okay, or handle more specifically
      throw new InternalServerErrorException(`Could not fetch user by email: ${error.message}`);
    }
  }

  /**
   * Find a user by email
   */
  async findByEmail(email: string): Promise<UserResponseDto | null> {
    try {
      const result = await this.databaseService.query(
        'SELECT id, email, username, phone, role, address, location, created_at, updated_at, is_active, profile_image, first_name, last_name, last_login, stripe_customer_id, stripe_subscription_id FROM users WHERE email = $1',
        [email]
      );
      
      if (result.rows.length === 0) return null;
      return mapToUserResponseDto(result.rows[0]);
    } catch (error) {
      this.logger.error(`Error finding user by email ${email}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Find a user by phone number
   */
  async findByPhone(phone: string): Promise<UserResponseDto | null> {
    try {
      const result = await this.databaseService.query(
        'SELECT id, email, username, phone, role, address, location, created_at, updated_at, is_active, profile_image, first_name, last_name, last_login, stripe_customer_id, stripe_subscription_id FROM users WHERE phone = $1',
        [phone]
      );
      
      if (result.rows.length === 0) return null;
      return mapToUserResponseDto(result.rows[0]);
    } catch (error) {
      this.logger.error(`Error finding user by phone ${phone}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Find a user by username (internal use, might need full entity)
   */
  async findByUsernameInternal(username: string): Promise<UserEntity | null> {
    try {
      const result = await this.databaseService.query(
        'SELECT * FROM users WHERE username = $1', // Fetches all columns
        [username]
      );
      return result.rows[0] || null;
    } catch (error) {
      this.logger.error(`Error finding user by username ${username}: ${error.message}`);
      throw new InternalServerErrorException(`Could not fetch user by username: ${error.message}`);
    }
  }

  /**
   * Find a user by username
   */
  async findByUsername(username: string): Promise<UserResponseDto | null> {
    try {
      const result = await this.databaseService.query(
        'SELECT id, email, username, phone, role, address, location, created_at, updated_at, is_active, profile_image, first_name, last_name, last_login, stripe_customer_id, stripe_subscription_id FROM users WHERE username = $1',
        [username]
      );
      
      if (result.rows.length === 0) return null;
      return mapToUserResponseDto(result.rows[0]);
    } catch (error) {
      this.logger.error(`Error finding user by username ${username}: ${error.message}`);
      throw new InternalServerErrorException(`Could not fetch user by username: ${error.message}`);
    }
  }

  /**
   * Create a new user
   */
  async create(createUserDto: CreateUserDto, userFromJwt: { id: number }): Promise<UserResponseDto> { 
    const currentUser = await this.getCurrentUserEntity(userFromJwt);

    if (currentUser.role === 'pharmacy_admin') {
      if (!['delivery_person', 'customer'].includes(createUserDto.role || 'customer')) {
        throw new ForbiddenException('Pharmacy admins can only create delivery persons or customers.');
      }
    } else if (currentUser.role !== 'admin') {
        throw new ForbiddenException('You are not authorized to create users.');
    }

    const { email, username, password, ...otherData } = createUserDto;

    const existingByEmail = await this.findByEmailInternal(email);
    if (existingByEmail) {
      throw new BadRequestException(`User with email ${email} already exists.`);
    }
    if (username) {
      const existingByUsername = await this.findByUsernameInternal(username);
      if (existingByUsername) {
        throw new BadRequestException(`User with username ${username} already exists.`);
      }
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);

    const userData: Partial<UserEntity> & { email: string; password_hash: string } = {
      ...otherData,
      email,
      username,
      password_hash: hashedPassword,
      status: createUserDto.status || 'pending', 
      role: createUserDto.role || 'customer',
    };
    
    if (currentUser.role === 'pharmacy_admin') {
        userData.pharmacy_id = currentUser.pharmacy_id;
    } else if (currentUser.role === 'admin' && createUserDto.pharmacy_id) { 
        // TODO: Validate if pharmacy_id exists if an admin provides it.
        // For now, assume it might be valid or caught by DB foreign key constraint.
        // const pharmacyExists = await this.pharmacyService.exists(createUserDto.pharmacy_id);
        // if (!pharmacyExists) throw new BadRequestException('Invalid pharmacy_id provided.');
        userData.pharmacy_id = createUserDto.pharmacy_id;
    }


    try {
      const validUserData = Object.entries(userData).reduce((acc, [key, value]) => {
        if (value !== undefined) {
          acc[key] = value;
        }
        return acc;
      }, {});

      const columns = Object.keys(validUserData).join(', ');
      const placeholders = Object.keys(validUserData).map((_, i) => `$${i + 1}`).join(', ');
      const values = Object.values(validUserData);
      
      const query = `
        INSERT INTO users (${columns}, created_at, updated_at)
        VALUES (${placeholders}, NOW(), NOW())
        RETURNING id, name, email, username, phone, role, status, pharmacy_id, created_at, updated_at, avatar_url, preferences
      `;
      
      const result = await this.databaseService.query(query, values);
      
      this.logger.log(`Created new user with ID: ${result.rows[0].id} by user ${currentUser.id}`);
      return mapToUserResponseDto(result.rows[0]);
    } catch (error) {
      this.logger.error(`Error creating user: ${error.message}`, error.stack);
      if (error.message.includes('users_pharmacy_id_fkey') || error.message.includes('violates foreign key constraint')) {
        throw new BadRequestException('Invalid pharmacy_id provided. The pharmacy does not exist.');
      }
      throw new InternalServerErrorException(`Could not create user: ${error.message}`);
    }
  }
  
  /**
   * Update user profile (for the currently authenticated user)
   */
  async updateProfile(updateUserDto: UpdateUserDto, userFromJwt: { id: number }): Promise<UserResponseDto> {
    const currentUser = await this.getCurrentUserEntity(userFromJwt);
    const userId = currentUser.id;
    const { role, status, pharmacy_id, ...profileData } = updateUserDto; 

    if (role || status || pharmacy_id !== undefined) { 
        throw new BadRequestException("Role, status, and pharmacy ID cannot be updated through this profile endpoint.");
    }
    
    try {
      const allowedFields = ['name', 'email', 'phone', 'address', 'avatar_url', 'preferences', 'username'];
      const updates: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;
      
      if (profileData.email && profileData.email !== currentUser.email) {
          const existingByEmail = await this.findByEmailInternal(profileData.email);
          if (existingByEmail && existingByEmail.id !== userId) {
              throw new BadRequestException(`Email ${profileData.email} is already in use.`);
          }
      }
      if (profileData.username && profileData.username !== currentUser.username) {
          const existingByUsername = await this.findByUsernameInternal(profileData.username);
          if (existingByUsername && existingByUsername.id !== userId) {
              throw new BadRequestException(`Username ${profileData.username} is already in use.`);
          }
      }

      Object.keys(profileData).forEach(key => {
        // Ensure key is a property of profileData and allowed
        if (allowedFields.includes(key) && profileData.hasOwnProperty(key) && profileData[key] !== undefined) {
          updates.push(`${key} = $${paramIndex}`);
          values.push(profileData[key]);
          paramIndex++;
        }
      });
      
      if (updates.length === 0) {
        this.logger.warn(`No valid fields provided for profile update for user ${userId}`);
        const userFromDb = await this.findOne(userId); 
        if (!userFromDb) throw new NotFoundException(`User with ID ${userId} not found.`);
        return userFromDb; // Already a UserResponseDto
      }
      
      updates.push(`updated_at = NOW()`);
      values.push(userId); 
      
      const query = `
        UPDATE users 
        SET ${updates.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING id, name, email, username, phone, role, status, pharmacy_id, created_at, updated_at, avatar_url, preferences
      `;
      
      const result = await this.databaseService.query(query, values);
      
      if (result.rows.length === 0) {
        throw new NotFoundException(`User with ID ${userId} not found during profile update.`);
      }
      
      this.logger.log(`Updated profile for user ${userId}`);
      return mapToUserResponseDto(result.rows[0]);
    } catch (error) {
      this.logger.error(`Error updating profile for user ${userId}: ${error.message}`, error.stack);
      if (error instanceof NotFoundException || error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException(`Could not update profile: ${error.message}`);
    }
  }

  /**
   * Update a user (admin/pharmacy_admin only)
   */
  async update(id: number, updateUserDto: UpdateUserDto, userFromJwt: { id: number }): Promise<UserResponseDto> {
    const currentUser = await this.getCurrentUserEntity(userFromJwt);
    this.logger.log(`User ${currentUser.id} (role: ${currentUser.role}) attempting to update user ${id}`);
    
    const userToUpdate = await this.findOneInternal(id); 
    if (!userToUpdate) {
        throw new NotFoundException(`User with ID ${id} not found.`);
    }

    if (currentUser.role === 'PHARMACY_STAFF') {
        if (userToUpdate.pharmacy_id !== currentUser.pharmacy_id) {
            throw new ForbiddenException('You can only update users in your pharmacy.');
        }
        if (updateUserDto.role && updateUserDto.role !== userToUpdate.role) {
            throw new ForbiddenException('Pharmacy admins cannot change user roles.');
        }
        if (updateUserDto.pharmacy_id && updateUserDto.pharmacy_id !== userToUpdate.pharmacy_id) {
            // This also implies they cannot set it to null if it was their pharmacy, or to another pharmacy.
            throw new ForbiddenException('Pharmacy admins cannot change user pharmacy assignment.');
        }
         // Pharmacy admins cannot update other admins or pharmacy_admins
        if ((['ADMIN', 'PHARMACY_STAFF'].includes(userToUpdate.role)) && userToUpdate.id !== currentUser.id ) {
            throw new ForbiddenException('Pharmacy admins cannot update admin or other pharmacy admin accounts.');
        }
    } else if (currentUser.role !== 'ADMIN') {
        throw new ForbiddenException('You are not authorized to update this user.');
    }

    if (id === currentUser.id && updateUserDto.role && updateUserDto.role !== currentUser.role && currentUser.role === 'ADMIN') {
        throw new BadRequestException('Admins cannot change their own role via this endpoint. Use assign-role for clarity or a dedicated process.');
    }
    if (id === currentUser.id && updateUserDto.status && updateUserDto.status !== currentUser.status && currentUser.role === 'ADMIN') {
         if (updateUserDto.status !== 'active') {
            throw new BadRequestException('Admins cannot set their own status to non-active via this generic update.');
         }
    }


    const { ...otherData } = updateUserDto;
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (otherData.email && otherData.email !== userToUpdate.email) {
        const existingByEmail = await this.findByEmailInternal(otherData.email);
        if (existingByEmail && existingByEmail.id !== id) {
            throw new BadRequestException(`Email ${otherData.email} is already in use.`);
        }
    }
    if (otherData.username && otherData.username !== userToUpdate.username) {
        const existingByUsername = await this.findByUsernameInternal(otherData.username);
        if (existingByUsername && existingByUsername.id !== id) {
            throw new BadRequestException(`Username ${otherData.username} is already in use.`);
        }
    }

    const allowedFields = ['name', 'email', 'phone', 'address', 'avatar_url', 'preferences', 'username', 'status', 'role', 'pharmacy_id'];
    Object.keys(otherData).forEach(key => {
        if (allowedFields.includes(key) && otherData.hasOwnProperty(key) && otherData[key] !== undefined) {
            // Specific check for pharmacy_id if admin is setting it
            if (key === 'pharmacy_id' && currentUser.role === 'admin') {
                 // TODO: Validate if pharmacy_id exists if an admin provides it.
                 // For now, assume it might be valid or caught by DB foreign key constraint.
            }
            updates.push(`${key} = $${paramIndex}`);
            values.push(otherData[key]);
            paramIndex++;
        }
    });

    if (updates.length === 0) {
        // If no actual data fields are being updated, but perhaps DTO was sent with only e.g. role for a non-admin.
        // Or if all undefined values were passed.
        this.logger.warn(`No valid updatable fields provided for user ${id}. Returning current data.`);
        return mapToUserResponseDto(userToUpdate); // Return existing data if no changes.
    }

    updates.push(`updated_at = NOW()`);
    values.push(id); 

    const query = `
        UPDATE users
        SET ${updates.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING id, name, email, username, phone, role, status, pharmacy_id, created_at, updated_at, avatar_url, preferences
    `;

    try {
        const result = await this.databaseService.query(query, values);
        if (result.rows.length === 0) { 
            throw new NotFoundException(`User with ID ${id} not found during update execution.`);
        }
        this.logger.log(`User ${id} updated by ${currentUser.id}.`);
        return mapToUserResponseDto(result.rows[0]);
    } catch (error) {
        this.logger.error(`Error updating user ${id}: ${error.message}`, error.stack);
        if (error instanceof NotFoundException || error instanceof BadRequestException || error instanceof ForbiddenException) throw error;
        if (error.message.includes('users_pharmacy_id_fkey') || error.message.includes('violates foreign key constraint')) {
             throw new BadRequestException('Invalid pharmacy_id provided. The pharmacy does not exist.');
        }
        throw new InternalServerErrorException(`Could not update user: ${error.message}`);
    }
  }

  /**
   * Delete a user
   */
  async remove(id: number, userFromJwt: { id: number }): Promise<{ message: string }> {
    const currentUser = await this.getCurrentUserEntity(userFromJwt);
    this.logger.log(`User ${currentUser.id} (role: ${currentUser.role}) attempting to delete user ${id}`);
    
    if (id === currentUser.id) {
      throw new BadRequestException('You cannot delete your own account.');
    }
    
    const userToDelete = await this.findOneInternal(id);
    if (!userToDelete) {
        throw new NotFoundException(`User with ID ${id} not found.`);
    }

    if (currentUser.role === 'PHARMACY_STAFF') {
        if (userToDelete.pharmacy_id !== currentUser.pharmacy_id) {
            throw new ForbiddenException('You can only delete users in your pharmacy.');
        }
        if (['ADMIN', 'PHARMACY_STAFF'].includes(userToDelete.role)) {
            throw new ForbiddenException('Pharmacy admins cannot delete admin or other pharmacy admin accounts.');
        }
    } else if (currentUser.role !== 'ADMIN') {
        throw new ForbiddenException('You are not authorized to delete this user.');
    }
    
    if (userToDelete.role === 'ADMIN' && currentUser.role !== 'ADMIN') { // Should be caught by above
       throw new ForbiddenException('You are not authorized to delete an admin user.');
    }


    try {
      // Consider what happens to related data (e.g., orders, deliveries) if a user is deleted.
      // Soft delete (setting a status like 'deleted') might be preferable.
      // For hard delete:
      const result = await this.databaseService.query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);
      if (result.rows.length === 0) { 
        throw new NotFoundException(`User with ID ${id} not found, or delete failed.`);
      }
      this.logger.log(`User ${id} deleted successfully by user ${currentUser.id}.`);
      return { message: `User with ID ${id} has been deleted.` };
    } catch (error) {
      this.logger.error(`Error deleting user ${id}: ${error.message}`, error.stack);
      // Check for foreign key constraints if user deletion is blocked by related data
      if (error.message.includes('violates foreign key constraint')) {
          throw new BadRequestException(`Cannot delete user ${id}. They have related records (e.g., orders, assignments) that must be handled first.`);
      }
      if (error instanceof NotFoundException || error instanceof BadRequestException || error instanceof ForbiddenException) throw error;
      throw new InternalServerErrorException(`Could not delete user: ${error.message}`);
    }
  }

  /**
   * Sets or updates a user's password hash.
   * This method is intended for internal use by authentication services.
   * It also sets the user status to 'active' and updates the timestamp.
   */
  async setPassword(userId: number, passwordHash: string): Promise<void> {
    this.logger.log(`Setting new password for user ${userId}.`);
    try {
      const result = await this.databaseService.query(
        'UPDATE users SET password_hash = $1, status = $2, updated_at = NOW() WHERE id = $3 RETURNING id',
        [passwordHash, 'active', userId]
      );
      if (result.rows.length === 0) {
        throw new NotFoundException(`User with ID ${userId} not found when attempting to set password.`);
      }
      this.logger.log(`Password updated successfully for user ${userId}. Status set to active.`);
    } catch (error) {
      this.logger.error(`Error setting password for user ${userId}: ${error.message}`, error.stack);
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(`Could not update password for user ${userId}.`);
    }
  }

  /**
   * Reset user password (admin action)
   */
  async resetPassword(id: number, userFromJwt: { id: number }): Promise<{ message: string }> {
    const currentUser = await this.getCurrentUserEntity(userFromJwt);
    this.logger.log(`User ${currentUser.id} (role: ${currentUser.role}) attempting to reset password for user ${id}`);
    
    const userToReset = await this.findOneInternal(id); 
    if (!userToReset) {
        throw new NotFoundException(`User with ID ${id} not found.`);
    }

    if (currentUser.role === 'PHARMACY_STAFF') {
        if (userToReset.pharmacy_id !== currentUser.pharmacy_id) {
            throw new ForbiddenException('You can only reset passwords for users in your pharmacy.');
        }
        if (['ADMIN', 'PHARMACY_STAFF'].includes(userToReset.role) && userToReset.id !== currentUser.id) {
             throw new ForbiddenException('Pharmacy admins cannot reset passwords for admin or other pharmacy admin accounts.');
        }
    } else if (currentUser.role !== 'ADMIN') {
        throw new ForbiddenException('You are not authorized to reset passwords.');
    }
    
    const tempPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    try {
      await this.databaseService.query(
        'UPDATE users SET password_hash = $1, updated_at = NOW(), status = $2 WHERE id = $3',
        [hashedPassword, 'pending', id] // Set status to pending to force password change on next login
      );
      
      // TODO: Implement MailService and uncomment:
      // await this.mailService.sendPasswordResetEmail(userToReset.email, tempPassword, userToReset.name || 'User');
      this.logger.log(`Password for user ${id} has been reset by ${currentUser.id}. Temp password: ${tempPassword} (LOGGED FOR DEV ONLY)`);
      return { message: `Password for user ${userToReset.email} has been reset. User status set to 'pending'. A notification should be sent to the user.` };
    } catch (error) {
      this.logger.error(`Error resetting password for user ${id}: ${error.message}`, error.stack);
      throw new InternalServerErrorException(`Could not reset password: ${error.message}`);
    }
  }


  async findAll(filterDto: UserFilterDto, userFromJwt: { id: number }): Promise<{ data: UserResponseDto[], total: number, currentPage: number, totalPages: number }> {
    const currentUser = await this.getCurrentUserEntity(userFromJwt);
    this.logger.log(`User ${currentUser.id} (role: ${currentUser.role}) fetching all users with filter: ${JSON.stringify(filterDto)}`);
    
    const { role, status, pharmacyId, search, page = 1, limit = 10 } = filterDto;
    const offset = (page - 1) * limit;

    let query = 'SELECT id, name, email, username, phone, role, status, pharmacy_id, created_at, updated_at, avatar_url, preferences FROM users WHERE 1=1';
    const queryParams: any[] = [];
    let paramIndex = 1;

    let countQueryBase = 'SELECT COUNT(*) FROM users WHERE 1=1';
    const countQueryParams: any[] = [];
    let countParamIndex = 1;

    // Common filter application logic for both query and countQueryBase
    const applyFilters = (currentQuery: string, paramsArray: any[], pIndex: number) => {
      let newQuery = currentQuery;
      let newPIndex = pIndex;

      if (currentUser.role === 'pharmacy_admin') {
          newQuery += ` AND pharmacy_id = $${newPIndex++}`;
          paramsArray.push(currentUser.pharmacy_id); 
      } else if (pharmacyId && currentUser.role === 'admin') { 
          newQuery += ` AND pharmacy_id = $${newPIndex++}`;
          paramsArray.push(pharmacyId);
      } else if (pharmacyId && currentUser.role !== 'admin') {
          // Non-admin trying to filter by pharmacyId when not a pharmacy_admin (who gets auto-filtered)
          // This case should ideally not happen if UI restricts, or throw ForbiddenException.
          // For now, this filter will be ignored if not admin.
          this.logger.warn(`User ${currentUser.id} (role: ${currentUser.role}) attempted to filter by pharmacyId ${pharmacyId} without admin rights. Filter ignored.`);
      }

      if (role) {
        newQuery += ` AND role = $${newPIndex++}`;
        paramsArray.push(role);
      }
      if (status) {
        newQuery += ` AND status = $${newPIndex++}`;
        paramsArray.push(status);
      }
      if (search) {
        // Ensure search term is treated as a single parameter for ILIKE
        const searchTerm = `%${search}%`;
        newQuery += ` AND (name ILIKE $${newPIndex} OR email ILIKE $${newPIndex} OR username ILIKE $${newPIndex})`;
        paramsArray.push(searchTerm);
        newPIndex++; // Increment after using the parameter
      }
      return { query: newQuery, params: paramsArray, pIndex: newPIndex };
    };

    const mainFilterResults = applyFilters(query, queryParams, paramIndex);
    query = mainFilterResults.query;
    // queryParams are already updated by reference by applyFilters

    const countFilterResults = applyFilters(countQueryBase, countQueryParams, countParamIndex);
    const countQuery = countFilterResults.query;
    // countQueryParams are updated by reference

    query += ` ORDER BY created_at DESC LIMIT $${mainFilterResults.pIndex++} OFFSET $${mainFilterResults.pIndex++}`;
    mainFilterResults.params.push(limit, offset);
    
    try {
      const result = await this.databaseService.query(query, mainFilterResults.params);
      const totalResult = await this.databaseService.query(countQuery, countFilterResults.params); 
      const total = parseInt(totalResult.rows[0].count, 10);
      
      return {
        data: result.rows.map(mapToUserResponseDto),
        total,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      this.logger.error(`Error fetching all users: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Could not fetch users.');
    }
  }

  async getStats(userFromJwt: { id: number }): Promise<UserStatsResponseDto> {
    const currentUser = await this.getCurrentUserEntity(userFromJwt);
    this.logger.log(`User ${currentUser.id} (role: ${currentUser.role}) requesting user stats.`);
    
    let baseQuery = 'FROM users';
    const queryParams: any[] = [];
    let whereClause = '';

    if (currentUser.role === 'PHARMACY_STAFF') {
        whereClause = ' WHERE pharmacy_id = $1';
        queryParams.push(currentUser.pharmacy_id);
    } else if (currentUser.role !== 'ADMIN') {
        throw new ForbiddenException('You are not authorized to view these statistics.');
    }

    baseQuery += whereClause;

    try {
        const totalUsersResult = await this.databaseService.query(`SELECT COUNT(*) as total_users ${baseQuery}`, queryParams);
        const usersByRoleResult = await this.databaseService.query(`SELECT role, COUNT(*) as count ${baseQuery} GROUP BY role`, queryParams);
        const usersByStatusResult = await this.databaseService.query(`SELECT status, COUNT(*) as count ${baseQuery} GROUP BY status`, queryParams);

        return {
            totalUsers: parseInt(totalUsersResult.rows[0].total_users, 10) || 0,
            byRole: usersByRoleResult.rows.reduce((acc, row) => { acc[row.role] = parseInt(row.count, 10); return acc; }, {}),
            byStatus: usersByStatusResult.rows.reduce((acc, row) => { acc[row.status] = parseInt(row.count, 10); return acc; }, {}),
        };
    } catch (error) {
        this.logger.error(`Error fetching user stats: ${error.message}`, error.stack);
        throw new InternalServerErrorException('Could not fetch user statistics.');
    }
  }

  async updateStatus(id: number, status: string, userFromJwt: { id: number }): Promise<UserResponseDto> {
    const currentUser = await this.getCurrentUserEntity(userFromJwt);
    this.logger.log(`User ${currentUser.id} (role: ${currentUser.role}) attempting to update status of user ${id} to ${status}.`);
    
    const userToUpdate = await this.findOneInternal(id);
    if (!userToUpdate) {
        throw new NotFoundException(`User with ID ${id} not found.`);
    }

    if (currentUser.role === 'PHARMACY_STAFF') {
        if (userToUpdate.pharmacy_id !== currentUser.pharmacy_id) {
            throw new ForbiddenException('You can only update status for users in your pharmacy.');
        }
        if (['ADMIN', 'PHARMACY_STAFF'].includes(userToUpdate.role) && userToUpdate.id !== currentUser.id) {
             throw new ForbiddenException('Pharmacy admins cannot change status of admin or other pharmacy admin accounts.');
        }
    } else if (currentUser.role !== 'ADMIN') {
        throw new ForbiddenException('You are not authorized to update user status.');
    }

    if (id === currentUser.id) { // Self-update checks
        if (status === 'blocked' || status === 'inactive') {
             throw new BadRequestException('You cannot block or deactivate your own account through this endpoint.');
        }
        if (currentUser.role === 'ADMIN' && status !== 'active') {
            throw new BadRequestException('Admins cannot change their own status to non-active.');
        }
    }


    const validStatuses = ['active', 'inactive', 'pending', 'blocked']; 
    if (!validStatuses.includes(status)) {
        throw new BadRequestException(`Invalid status: ${status}. Must be one of ${validStatuses.join(', ')}.`);
    }

    try {
      const result = await this.databaseService.query(
        'UPDATE users SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING id, name, email, username, phone, role, status, pharmacy_id, created_at, updated_at, avatar_url, preferences',
        [status, id]
      );
      if (result.rows.length === 0) {
        throw new NotFoundException(`User with ID ${id} not found during status update.`);
      }
      this.logger.log(`Status for user ${id} updated to ${status} by ${currentUser.id}.`);
      return mapToUserResponseDto(result.rows[0]);
    } catch (error) {
      this.logger.error(`Error updating status for user ${id}: ${error.message}`, error.stack);
      if (error instanceof NotFoundException || error instanceof BadRequestException || error instanceof ForbiddenException) throw error;
      throw new InternalServerErrorException('Could not update user status.');
    }
  }

  async assignRole(id: number, role: string, userFromJwt: { id: number }): Promise<UserResponseDto> {
    const currentUser = await this.getCurrentUserEntity(userFromJwt);
    this.logger.log(`User ${currentUser.id} (role: ${currentUser.role}) attempting to assign role ${role} to user ${id}.`);
    
    if (currentUser.role !== 'ADMIN') {
        throw new ForbiddenException('Only admins can assign roles.');
    }
    
    const userToUpdate = await this.findOneInternal(id);
    if (!userToUpdate) {
        throw new NotFoundException(`User with ID ${id} not found.`);
    }

    if (id === currentUser.id && role !== 'ADMIN') {
        throw new BadRequestException('Admin cannot change their own role to non-admin via this method.');
    }
    
    // TODO: Define valid roles centrally, perhaps from an enum or config shared with DTOs
    const validRoles = ['ADMIN', 'PHARMACY_STAFF', 'DELIVERY_PERSON', 'CUSTOMER', 'PHARMACIST'];
    if (!validRoles.includes(role)) {
        throw new BadRequestException(`Invalid role: ${role}. Must be one of ${validRoles.join(', ')}.`);
    }

    // If assigning/changing to pharmacy_admin, ensure pharmacy_id is handled.
    // If role becomes 'PHARMACY_STAFF' and pharmacy_id is null, this might be an issue.
    // If role changes from 'PHARMACY_STAFF' to something else, should pharmacy_id be cleared?
    // Current: This method only changes the role. assignPharmacy handles pharmacy_id.
    // Consider if pharmacy_id should be cleared if user is no longer pharmacy_admin or delivery_person.
    let newPharmacyId = userToUpdate.pharmacy_id;
    if (role !== 'PHARMACY_STAFF' && role !== 'DELIVERY_PERSON' && userToUpdate.role === 'PHARMACY_STAFF') {
        // If demoting from a pharmacy-specific role, consider clearing pharmacy_id
        // For now, we leave it, to be managed by assignPharmacy explicitly.
        // newPharmacyId = null; // Example if auto-clearing
    }


    try {
      const result = await this.databaseService.query(
        // 'UPDATE users SET role = $1, pharmacy_id = $2, updated_at = NOW() WHERE id = $3 RETURNING ...',
        // [role, newPharmacyId, id] // If pharmacy_id was also managed here
        'UPDATE users SET role = $1, updated_at = NOW() WHERE id = $2 RETURNING id, name, email, username, phone, role, status, pharmacy_id, created_at, updated_at, avatar_url, preferences',
        [role, id]
      );
      if (result.rows.length === 0) {
        throw new NotFoundException(`User with ID ${id} not found during role assignment.`);
      }
      this.logger.log(`Role for user ${id} assigned to ${role} by ${currentUser.id}.`);
      return mapToUserResponseDto(result.rows[0]);
    } catch (error) {
      this.logger.error(`Error assigning role for user ${id}: ${error.message}`, error.stack);
      if (error instanceof NotFoundException || error instanceof BadRequestException || error instanceof ForbiddenException) throw error;
      throw new InternalServerErrorException('Could not assign role.');
    }
  }

  async assignPharmacy(id: number, pharmacyId: number | null, userFromJwt: { id: number }): Promise<UserResponseDto> {
    const currentUser = await this.getCurrentUserEntity(userFromJwt);
    this.logger.log(`User ${currentUser.id} (role: ${currentUser.role}) attempting to assign pharmacy ${pharmacyId} to user ${id}.`);

    const userToUpdate = await this.findOneInternal(id);
    if (!userToUpdate) {
        throw new NotFoundException(`User with ID ${id} not found.`);
    }

    if (currentUser.role === 'PHARMACY_STAFF') {
        if (pharmacyId !== currentUser.pharmacy_id) { // Can only assign to their own pharmacy
            throw new ForbiddenException('Pharmacy admins can only assign users to their own pharmacy.');
        }
        // Cannot assign/modify other admins or pharmacy_admins
        if (['ADMIN', 'PHARMACY_STAFF'].includes(userToUpdate.role) && userToUpdate.id !== currentUser.id) {
            throw new ForbiddenException('Pharmacy admins cannot change pharmacy assignment for admin or other pharmacy admin accounts.');
        }
        // User must be of a role that can be associated with a pharmacy (e.g. delivery_person, or even customer if that's a model)
        // Or if they are making themselves (a pharmacy_admin) associated with their pharmacy (should already be true).
        if (!['DELIVERY_PERSON', 'CUSTOMER', 'PHARMACY_STAFF', 'PHARMACIST'].includes(userToUpdate.role)) {
             throw new BadRequestException(`User role (${userToUpdate.role}) cannot be directly assigned to a pharmacy by a pharmacy admin.`);
        }

    } else if (currentUser.role !== 'ADMIN') {
        throw new ForbiddenException('You are not authorized to assign pharmacies.');
    }

    // Admin specific: if assigning a user to be a pharmacy_admin, they MUST have a pharmacyId.
    if (userToUpdate.role === 'PHARMACY_STAFF' && pharmacyId === null && id !== currentUser.id) { // Don't let admin unassign other pharmacy_admins from their pharmacy
        throw new BadRequestException('Pharmacy admins must be assigned to a valid pharmacy. Cannot set pharmacy to null.');
    }
    // If user is not a pharmacy-related role, but admin is assigning them a pharmacy, it might be okay or might need role change.
    // For now, we allow admin to set pharmacy_id regardless of role, but this could be tightened.
    // e.g. if ( !(['pharmacy_admin', 'delivery_person'].includes(userToUpdate.role)) && pharmacyId !== null) { warn or deny }


    // TODO: Check if pharmacyId (if not null) exists in the 'pharmacies' table
    // This would require another service call, e.g., `pharmacyService.findOne(pharmacyId)`
    // if (pharmacyId !== null) {
    //   const pharmacyExists = await this.pharmacyService.exists(pharmacyId); // Assuming such a service/method
    //   if (!pharmacyExists) {
    //     throw new BadRequestException(`Pharmacy with ID ${pharmacyId} does not exist.`);
    //   }
    // }

    try {
      const result = await this.databaseService.query(
        'UPDATE users SET pharmacy_id = $1, updated_at = NOW() WHERE id = $2 RETURNING id, name, email, username, phone, role, status, pharmacy_id, created_at, updated_at, avatar_url, preferences',
        [pharmacyId, id] // pharmacyId can be null here
      );
      if (result.rows.length === 0) {
        throw new NotFoundException(`User with ID ${id} not found during pharmacy assignment.`);
      }
      this.logger.log(`User ${id} assigned to pharmacy ${pharmacyId} by ${currentUser.id}.`);
      return mapToUserResponseDto(result.rows[0]);
    } catch (error) {
      this.logger.error(`Error assigning pharmacy for user ${id}: ${error.message}`, error.stack);
      if (error instanceof NotFoundException || error instanceof BadRequestException || error instanceof ForbiddenException) throw error;
      if (error.message.includes('violates foreign key constraint') && error.message.includes('users_pharmacy_id_fkey')) {
        throw new BadRequestException(`Invalid pharmacy ID: ${pharmacyId}. It may not exist or there is a data integrity issue.`);
      }
      throw new InternalServerErrorException('Could not assign pharmacy.');
    }
  }

  async changePassword(userFromJwt: { id: number }, changePasswordDto: ChangePasswordDto): Promise<{ message: string }> {
    // Note: Controller passes req.user.id directly, so we fetch entity here.
    const currentUserEntity = await this.findOneInternal(userFromJwt.id);
    if (!currentUserEntity) {
      throw new ForbiddenException('User not found or not authenticated properly.'); 
    }
    const userId = currentUserEntity.id; // Use ID from fetched entity

    const { oldPassword, newPassword } = changePasswordDto;

    const isPasswordMatching = await bcrypt.compare(oldPassword, currentUserEntity.password_hash);
    if (!isPasswordMatching) {
      throw new BadRequestException('Invalid old password.');
    }

    if (oldPassword === newPassword) {
        throw new BadRequestException('New password cannot be the same as the old password.');
    }
    
    // TODO: Add password strength validation from config or constants
    // const passwordPolicy = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)[a-zA-Z\\d]{8,}$/; 
    // if (!passwordPolicy.test(newPassword)) {
    //   throw new BadRequestException('Password does not meet complexity requirements: Minimum 8 characters, at least one uppercase letter, one lowercase letter, and one number.');
    // }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    try {
      await this.databaseService.query(
        'UPDATE users SET password_hash = $1, updated_at = NOW(), status = CASE WHEN status = \'pending\' THEN \'active\' ELSE status END WHERE id = $2',
        [hashedPassword, userId]
      );
      this.logger.log(`Password changed successfully for user ${userId}.`);
      // TODO: Consider security logging for password changes (e.g., IP, timestamp)
      return { message: 'Password changed successfully.' };
    } catch (error) {
      this.logger.error(`Error changing password for user ${userId}: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Could not change password.');
    }
  }

  /**
   * Create a user from authentication service (special case for OTP auth)
   * Cette méthode est réservée au service d'authentification
   */
  async createFromAuth(userData: { email?: string; phone?: string; username?: string }): Promise<UserResponseDto> {
    this.logger.log(`Creating new user from auth service with data: ${JSON.stringify(userData)}`);
    
    try {
      // Validation de base des données requises
      if (!userData.email && !userData.phone && !userData.username) {
        throw new BadRequestException('Au moins un identifiant (email, téléphone ou nom d\'utilisateur) est requis.');
      }
      
      // Vérification des doublons
      if (userData.email) {
        const existingByEmail = await this.findByEmailInternal(userData.email);
        if (existingByEmail) {
          throw new BadRequestException(`Un utilisateur avec l'email ${userData.email} existe déjà.`);
        }
      }
      
      if (userData.username) {
        const existingByUsername = await this.findByUsernameInternal(userData.username);
        if (existingByUsername) {
          throw new BadRequestException(`Un utilisateur avec le nom d'utilisateur ${userData.username} existe déjà.`);
        }
      }
      
      // Construction des données utilisateur avec valeurs par défaut pour un nouvel utilisateur OTP
      const completeUserData = {
        ...userData,
        role: 'CUSTOMER', // Rôle par défaut
        status: 'active', // Les utilisateurs créés par OTP sont actifs par défaut
        created_at: new Date(),
        updated_at: new Date()
      };

      const columns = Object.keys(completeUserData).join(', ');
      const placeholders = Object.keys(completeUserData).map((_, i) => `$${i + 1}`).join(', ');
      const values = Object.values(completeUserData);
      
      const query = `
        INSERT INTO users (${columns})
        VALUES (${placeholders})
        RETURNING id, name, email, username, phone, role, status, pharmacy_id, created_at, updated_at, avatar_url, preferences
      `;
      
      const result = await this.databaseService.query(query, values);
      
      this.logger.log(`Utilisateur créé avec succès depuis le service d'authentification, ID: ${result.rows[0].id}`);
      return mapToUserResponseDto(result.rows[0]);
    } catch (error) {
      this.logger.error(`Erreur lors de la création d'utilisateur depuis auth: ${error.message}`, error.stack);
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException(`Impossible de créer l'utilisateur: ${error.message}`);
    }
  }

  // Helper to get full user entity internally, e.g., for auth checks or when password hash is needed
  private async findOneInternal(id: number): Promise<UserEntity | null> {
    try {
      const result = await this.databaseService.query(
        'SELECT * FROM users WHERE id = $1', // Select all columns
        [id]
      );
      if (result.rows.length === 0) {
        return null;
      }
      return result.rows[0] as UserEntity;
    } catch (error) {
      this.logger.error(`Error finding internal user ${id}: ${error.message}`);
      throw new InternalServerErrorException(`Could not fetch internal user data: ${error.message}`);
    }
  }

  /**
   * Met à jour la date de dernière déconnexion d'un utilisateur
   */
  async updateLastLogout(userId: number): Promise<void> {
    try {
      await this.databaseService.query(
        'UPDATE users SET last_logout = NOW() WHERE id = $1',
        [userId]
      );
      this.logger.log(`Updated last logout timestamp for user ${userId}`);
    } catch (error) {
      this.logger.error(`Error updating last logout for user ${userId}: ${error.message}`, error.stack);
      throw new InternalServerErrorException(`Could not update logout timestamp: ${error.message}`);
    }
  }
}