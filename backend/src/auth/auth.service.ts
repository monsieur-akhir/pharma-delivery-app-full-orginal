import { Injectable, Logger, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { NotificationsService } from '../notifications/notifications.service';
import * as bcrypt from 'bcrypt';

interface StoredOtp {
  otp: string;
  expires: Date;
  attempts: number;
  userId?: number;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly otpExpiry: number;
  private readonly otpStore: Map<string, StoredOtp> = new Map();

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly notificationsService: NotificationsService,
    private readonly configService: ConfigService,
  ) {
    this.otpExpiry = this.configService.get<number>('OTP_EXPIRY_MINUTES', 10) * 60 * 1000;
  }

  /**
   * Send OTP to user via email or SMS
   */
  async sendOtp(data: { identifier: string, password?: string, channel?: 'email' | 'sms' | 'both' }): Promise<{ success: boolean; message: string }> {
    try {
      const { identifier, channel = 'email' } = data;
      
      // Find the user
      const user = await this.findUserByIdentifier(identifier);
      
      // Generate a 6-digit OTP
      const otp = this.generateOtp();
      
      // Store the OTP with expiry
      this.otpStore.set(identifier, {
        otp,
        expires: new Date(Date.now() + this.otpExpiry),
        attempts: 0,
        userId: user?.id,
      });
      
      // Send OTP via the requested channel(s)
      if (channel === 'email' || channel === 'both') {
        const email = user?.email || (this.isValidEmail(identifier) ? identifier : null);
        
        if (email) {
          await this.notificationsService.sendEmail(
            email,
            'Verification Code',
            'otp',
            {
              otp,
              expiresIn: `${this.otpExpiry / 60000} minutes`,
            }
          );
        }
      }
      
      if (channel === 'sms' || channel === 'both') {
        const phone = user?.phone || (this.isValidPhone(identifier) ? identifier : null);
        
        if (phone) {
          await this.notificationsService.sendSms(
            phone,
            `Your verification code is: ${otp}. It will expire in ${this.otpExpiry / 60000} minutes.`
          );
        }
      }
      
      this.logger.log(`OTP sent to user with identifier ${identifier}`);
      
      return {
        success: true,
        message: 'Verification code sent',
      };
      
    } catch (error) {
      this.logger.error(`Failed to send OTP: ${error.message}`, error.stack);
      return {
        success: false,
        message: 'Failed to send verification code',
      };
    }
  }

  /**
   * Verify OTP and return JWT token
   */
  async verifyOtp(
    identifier: string,
    otp: string
  ): Promise<{ token: string; user: any; isNewUser: boolean }> {
    // Get stored OTP
    const storedData = this.otpStore.get(identifier);
    
    if (!storedData) {
      throw new UnauthorizedException('Verification code not found or expired');
    }
    
    // Check if OTP is expired
    if (new Date() > storedData.expires) {
      this.otpStore.delete(identifier);
      throw new UnauthorizedException('Verification code expired');
    }
    
    // Increment attempts
    storedData.attempts++;
    
    // Check if max attempts exceeded
    if (storedData.attempts > 3) {
      this.otpStore.delete(identifier);
      throw new UnauthorizedException('Too many attempts');
    }
    
    // Verify OTP
    if (storedData.otp !== otp) {
      throw new UnauthorizedException('Invalid verification code');
    }
    
    // OTP is valid, clear it from the store
    this.otpStore.delete(identifier);
    
    // Check if user exists
    let user = await this.findUserByIdentifier(identifier);
    let isNewUser = false;
    
    // Create user if doesn't exist
    if (!user) {
      isNewUser = true;
      
      const userData: any = {};
      
      if (this.isValidEmail(identifier)) {
        userData.email = identifier;
      } else if (this.isValidPhone(identifier)) {
        userData.phone = identifier;
      } else {
        userData.username = identifier;
      }
      
      // Create the new user using the auth-specific method
      user = await this.usersService.createFromAuth(userData);
    }
    
    // Generate JWT token
    const token = this.generateToken(user);
    
    this.logger.log(`User ${user.id} authenticated with OTP`);
    
    return {
      token,
      user,
      isNewUser,
    };
  }

  /**
   * Generate JWT token
   */
  private generateToken(user: any): string {
    const payload = {
      sub: user.id,
      username: user.username,
      email: user.email,
      phone: user.phone,
      role: user.role,
    };
    
    return this.jwtService.sign(payload);
  }

  /**
   * Validate user for JWT strategy
   */
  async validateUser(id: number): Promise<any | null> {
    return this.usersService.findById(id);
  }

  /**
   * Request password reset via OTP
   */
  async requestPasswordReset(
    identifier: string,
    channel: 'email' | 'sms' | 'both' = 'email'
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Find the user
      const user = await this.findUserByIdentifier(identifier);
      
      if (!user) {
        // For security reasons, don't disclose whether the user exists
        return {
          success: true,
          message: 'If the account exists, a password reset code has been sent',
        };
      }
      
      // Generate a 6-digit reset code
      const resetCode = this.generateOtp();
      
      // Store the reset code with expiry
      const resetKey = `reset_${identifier}`;
      this.otpStore.set(resetKey, {
        otp: resetCode,
        expires: new Date(Date.now() + this.otpExpiry),
        attempts: 0,
        userId: user.id,
      });
      
      // Send reset code via the requested channel(s)
      if (channel === 'email' || channel === 'both') {
        if (user.email) {
          await this.notificationsService.sendEmail(
            user.email,
            'Password Reset Code',
            'password_reset',
            {
              code: resetCode,
              expiresIn: `${this.otpExpiry / 60000} minutes`,
            }
          );
        }
      }
      
      if (channel === 'sms' || channel === 'both') {
        if (user.phone) {
          await this.notificationsService.sendSms(
            user.phone,
            `Your password reset code is: ${resetCode}. It will expire in ${this.otpExpiry / 60000} minutes.`
          );
        }
      }
      
      this.logger.log(`Password reset code sent to user ${user.id}`);
      
      return {
        success: true,
        message: 'Password reset code sent',
      };
      
    } catch (error) {
      this.logger.error(`Failed to send password reset code: ${error.message}`, error.stack);
      return {
        success: false,
        message: 'Failed to send password reset code',
      };
    }
  }

  /**
   * Verify password reset code and update password
   */
  async verifyPasswordReset(
    identifier: string,
    resetCode: string,
    newPassword: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const resetKey = `reset_${identifier}`;
      
      // Get stored reset code
      const storedData = this.otpStore.get(resetKey);
      
      if (!storedData) {
        throw new UnauthorizedException('Reset code not found or expired');
      }
      
      // Check if reset code is expired
      if (new Date() > storedData.expires) {
        this.otpStore.delete(resetKey);
        throw new UnauthorizedException('Reset code expired');
      }
      
      // Increment attempts
      storedData.attempts++;
      
      // Check if max attempts exceeded
      if (storedData.attempts > 3) { // Max 3 attempts for reset code
        this.otpStore.delete(resetKey);
        throw new UnauthorizedException('Too many attempts for reset code. Please request a new one.');
      }
      
      // Verify reset code
      if (storedData.otp !== resetCode) {
        // Do not delete the token on invalid attempt if attempts are remaining
        throw new UnauthorizedException('Invalid reset code');
      }
      
      // Reset code is valid, clear it from the store
      this.otpStore.delete(resetKey);
      
      // Find the user
      const user = await this.usersService.findById(storedData.userId);
      
      if (!user) {
        // This case should ideally not happen if userId in otpStore is always valid
        this.logger.error(`User with ID ${storedData.userId} not found after verifying reset token.`);
        throw new UnauthorizedException('User not found. Please contact support.');
      }

      // Validate new password strength
      const MIN_PASSWORD_LENGTH = 8;
      if (newPassword.length < MIN_PASSWORD_LENGTH) {
        throw new BadRequestException(`Password must be at least ${MIN_PASSWORD_LENGTH} characters long.`);
      }
      // Add more complex password rules if needed (e.g., uppercase, number, symbol)

      // Hash the new password
      const saltRounds = 10; // Or from config
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
      
      // Update user's password using a dedicated service method
      await this.usersService.setPassword(user.id, hashedPassword);
      
      this.logger.log(`Password reset completed for user ${user.id}`);
      
      return {
        success: true,
        message: 'Password reset successful. You can now log in with your new password.',
      };
      
    } catch (error) {
      this.logger.error(`Failed to verify password reset for identifier ${identifier}: ${error.message}`, error.stack);
      // Re-throw specific exceptions to be handled by NestJS default exception filter
      if (error instanceof UnauthorizedException || error instanceof BadRequestException) {
        throw error;
      }
      // Generic error for other cases
      throw new UnauthorizedException('Failed to reset password. Please try again or contact support.');
    }
  }

  /**
   * Find a user by identifier (email, phone, or username)
   */
  async findUserByIdentifier(identifier: string): Promise<any | undefined> {
    if (this.isValidEmail(identifier)) {
      return this.usersService.findByEmail(identifier);
    }
    
    if (this.isValidPhone(identifier)) {
      return this.usersService.findByPhone(identifier);
    }
    
    return this.usersService.findByUsername(identifier);
  }

  /**
   * Generate a 6-digit OTP
   */
  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Validate email address format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate phone number format
   */
  private isValidPhone(phone: string): boolean {
    // Simple pattern for international phone numbers
    // In production, should use a proper phone number validation library
    const phoneRegex = /^\+?[0-9]{8,15}$/;
    return phoneRegex.test(phone);
  }

  /**
   * Logout user and invalidate token
   */
  async logout(userId: number): Promise<{ success: boolean; message: string }> {
    try {
      // Note: Dans une implémentation plus complète, cela pourrait impliquer :
      // 1. Ajouter le token à une liste noire (avec Redis par exemple)
      // 2. Invalider la session utilisateur si elle est sauvegardée côté serveur
      // 3. Mettre à jour la date de dernière déconnexion de l'utilisateur
      
      // Mettre à jour la date de dernière déconnexion
      await this.usersService.updateLastLogout(userId);
      
      return {
        success: true,
        message: 'Successfully logged out'
      };
    } catch (error) {
      this.logger.error(`Error during logout: ${error.message}`);
      throw new BadRequestException('Failed to process logout request');
    }
  }
}