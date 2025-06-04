import { Injectable, UnauthorizedException, HttpException, HttpStatus, Logger, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DatabaseService } from '../../database/database.service';
import { eq, and, or, sql } from 'drizzle-orm';
import { users } from '../../../../shared/src/schema';
import { NotificationsService } from '../../notifications/notifications.service';
import * as bcrypt from 'bcrypt';
import { UserRole } from '../../users/enums/user-roles.enum'; // Added import
import { TokenBlacklistService } from './services/token-blacklist.service';

interface StoredOtp {
  otp: string;
  expires: Date;
  attempts: number;
  userId?: number;
}

@Injectable()
export class AdminAuthService {
  private readonly logger = new Logger(AdminAuthService.name);
  private otpStore: Map<string, StoredOtp> = new Map();
  private passwordResetStore: Map<string, StoredOtp> = new Map();

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly jwtService: JwtService,
    private readonly notificationsService: NotificationsService,
    private readonly tokenBlacklistService: TokenBlacklistService
  ) {
    // Journaliser l'initialisation du service
    this.logger.log('AdminAuthService initialisé');
  }
  
  /**
   * Méthode de diagnostic pour vérifier la connexion à la base de données et la structure des tables
   */
  async diagnoseDatabaseConnection(): Promise<any> {
    try {
      this.logger.log('Exécution du diagnostic de connexion à la base de données');
      
      // Vérifier si le service de base de données est disponible
      if (!this.databaseService) {
        return { 
          success: false, 
          message: 'Service de base de données non injecté' 
        };
      }
      
      if (!this.databaseService.db) {
        return { 
          success: false, 
          message: 'Instance de base de données non initialisée' 
        };
      }
      
      // Test de connexion simple - essayer de récupérer un utilisateur admin
      const testUser = await this.databaseService.db
        .select({ count: sql`count(*)` })
        .from(users)
        .where(eq(users.role, 'ADMIN'));
      
      // Récupérer la structure de la table users pour débogage
      const userColumns = Object.keys(users).filter(key => key !== 'relations' && key !== '_').map(key => {
        return {
          name: key,
          field: users[key].name,
          dataType: users[key].dataType
        };
      });
      
      return {
        success: true,
        message: 'Connexion à la base de données OK',
        userTableSchema: userColumns,
        adminCount: testUser[0]?.count || 0,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error(`Erreur lors du diagnostic: ${error.message}`);
      if (error.stack) {
        this.logger.error(`Stack trace: ${error.stack}`);
      }
      
      return {
        success: false,
        message: 'Erreur lors de la connexion à la base de données',
        error: error.message,
        stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Envoie un OTP par email et SMS à l'utilisateur admin
   */
  async requestOtp(username: string): Promise<{ success: boolean; message: string }> {
    try {
      // Récupérer l'utilisateur à partir de la base de données
      const usersFound = await this.databaseService.db
        .select()
        .from(users)
        .where(
          and(
            eq(users.username, username),
            eq(users.is_active, true)
          )
        );

      if (usersFound.length === 0) {
        throw new UnauthorizedException('Utilisateur non trouvé');
      }

      const user = usersFound[0];

      // Vérifier si l'utilisateur a un rôle administratif, super admin ou pharmacien
      if (user.role !== 'ADMIN' && user.role !== 'PHARMACIST' && user.role !== 'PHARMACY_STAFF' && user.role !== 'SUPER_ADMIN') {
        throw new UnauthorizedException('Permissions insuffisantes');
      }

      // Générer un OTP à 6 chiffres
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Stocker l'OTP avec expiration (10 minutes)
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 10);
      
      this.otpStore.set(username, {
        otp,
        expires: expiresAt,
        attempts: 0,
      });

      // Préparer le message OTP
      const otpMessage = `Votre code de connexion au back-office MediConnect est: ${otp}. Valide pendant 10 minutes.`;
      const otpEmailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Authentification MediConnect</h2>
          <p>Bonjour ${user.first_name || username},</p>
          <p>Voici votre code de connexion au back-office:</p>
          <div style="background-color: #f4f4f4; padding: 12px; font-size: 24px; text-align: center; letter-spacing: 5px; font-weight: bold; border-radius: 4px; margin: 15px 0;">
            ${otp}
          </div>
          <p>Ce code est valide pendant 10 minutes.</p>
          <p>Si vous n'avez pas demandé ce code, veuillez ignorer cet email.</p>
          <p>Cordialement,<br>L'équipe MediConnect</p>
        </div>
      `;

      // Envoyer par SMS
      try {
        if (user.phone) {
          await this.notificationsService.sendEmail(
            user.phone,
            'Code de connexion MediConnect',
            'otp-sms',
            {
              firstName: user.first_name || username,
              code: otp,
              validity: '10'
            }
          );
          this.logger.log(`OTP envoyé par SMS à ${user.phone}`);
        }
      } catch (error) {
        this.logger.error(`Erreur lors de l'envoi de l'OTP par SMS: ${error.message}`);
      }

      // Envoyer par email
      try {
        if (user.email) {
          await this.notificationsService.sendEmail(
            user.email,
            'Code de connexion MediConnect',
            'otp-email',
            {
              firstName: user.first_name || username,
              code: otp,
              validity: '10',
              year: new Date().getFullYear()
            }
          );
          this.logger.log(`OTP envoyé par email à ${user.email}`);
        }
      } catch (error) {
        this.logger.error(`Erreur lors de l'envoi de l'OTP par email: ${error.message}`);
      }

      // En développement, afficher l'OTP dans les logs
      this.logger.debug(`OTP pour ${username}: ${otp}`);

      return {
        success: true,
        message: 'Un code de connexion a été envoyé à votre email et téléphone.',
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.error(`Erreur lors de la demande d'OTP: ${error.message}`);
      throw new HttpException('Une erreur est survenue lors de la demande de code', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
  
  /**
   * Vérifie l'OTP et authentifie l'utilisateur
   */
  async verifyOtp(username: string, otp: string) {
    try {
      // Vérifier l'OTP
      const storedData = this.otpStore.get(username);
      
      if (!storedData) {
        throw new UnauthorizedException('Code expiré ou non trouvé. Veuillez demander un nouveau code.');
      }
      
      if (storedData.expires < new Date()) {
        this.otpStore.delete(username);
        throw new UnauthorizedException('Code expiré. Veuillez demander un nouveau code.');
      }
      
      // Augmenter le compteur de tentatives
      storedData.attempts += 1;
      
      // Maximum 3 tentatives
      if (storedData.attempts > 3) {
        this.otpStore.delete(username);
        throw new UnauthorizedException('Trop de tentatives échouées. Veuillez demander un nouveau code.');
      }
      
      // Vérifier si l'OTP correspond
      if (storedData.otp !== otp) {
        throw new UnauthorizedException('Code invalide. Veuillez réessayer.');
      }
      
      // OTP vérifié, le supprimer du store
      this.otpStore.delete(username);
      
      // Récupérer l'utilisateur
      const usersFound = await this.databaseService.db
        .select()
        .from(users)
        .where(
          and(
            eq(users.username, username),
            eq(users.is_active, true)
          )
        );

      if (usersFound.length === 0) {
        throw new UnauthorizedException('Utilisateur non trouvé');
      }

      const user = usersFound[0];

      // Mettre à jour la dernière connexion
      await this.databaseService.db
        .update(users)
        .set({ last_login: new Date() })
        .where(eq(users.id, user.id));

      // Créer le token JWT
      const payload = {
        sub: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      };

      return {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        name: user.first_name && user.last_name 
          ? `${user.first_name} ${user.last_name}` 
          : user.username,
        isActive: user.is_active,
        token: this.jwtService.sign(payload),
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.error(`Erreur lors de la vérification de l'OTP: ${error.message}`);
      throw new HttpException('Une erreur est survenue lors de la vérification du code', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Demande de réinitialisation de mot de passe pour les utilisateurs admin
   * Accepte un identifiant (email ou nom d'utilisateur)
   */
  async requestPasswordReset(
    identifier: string,
    redirectUrl?: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      let user = null;
      
      // Vérifier si l'identifiant est un email ou un nom d'utilisateur
      if (identifier.includes('@')) {
        // C'est un email
        const usersFound = await this.databaseService.db
          .select()
          .from(users)
          .where(
            and(
              eq(users.email, identifier),
              eq(users.is_active, true),
              or(
                eq(users.role, "ADMIN"),
                eq(users.role, "PHARMACY_STAFF"), // Correspond à PHARMACY_ADMIN dans l'enum
                eq(users.role, "SUPER_ADMIN")
              )
            )
          );
        
        if (usersFound.length > 0) {
          user = usersFound[0];
        }
      } else {
        // C'est un nom d'utilisateur
        const usersFound = await this.databaseService.db
          .select()
          .from(users)
          .where(
            and(
              eq(users.username, identifier),
              eq(users.is_active, true),
              or(
                eq(users.role, "ADMIN"),
                eq(users.role, "PHARMACY_STAFF"), // Correspond à PHARMACY_ADMIN dans l'enum
                eq(users.role, "SUPER_ADMIN")
              )
            )
          );
        
        if (usersFound.length > 0) {
          user = usersFound[0];
        }
      }

      if (!user) {
        // Pour des raisons de sécurité, ne pas révéler si l'utilisateur existe ou non
        return {
          success: true,
          message: 'Si votre compte existe, vous recevrez un code de réinitialisation.',
        };
      }

      // Générer un code à 6 chiffres
      const resetToken = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Stocker le token avec expiration (10 minutes)
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 10);
      
      // Identifiant unique pour cette réinitialisation
      const resetId = `${identifier}_${Date.now()}`;
      
      this.passwordResetStore.set(resetId, {
        otp: resetToken,
        expires: expiresAt,
        attempts: 0,
        userId: user.id,
      });

      // Données pour les templates
      const templateData = {
        firstName: user.first_name || user.username,
        code: resetToken,
        validity: '10',
        redirectUrl: redirectUrl || '',
        year: new Date().getFullYear()
      };

      // Envoyer par SMS si numéro de téléphone disponible
      if (user.phone) {
        try {
          await this.notificationsService.sendEmail(
            user.phone,
            'Réinitialisation de mot de passe',
            'password-reset-sms', 
            templateData
          );
          // Alternative if direct SMS is needed:
          // await this.notificationsService.sendSms(
          //   user.phone, 
          //   `Votre code de réinitialisation de mot de passe admin MediConnect est: ${resetToken}. Valable pendant 10 minutes.`
          // );
          this.logger.log(`Code de réinitialisation envoyé par SMS à ${user.phone}`);
        } catch (error) {
          this.logger.error(`Erreur lors de l'envoi du code par SMS: ${error.message}`);
        }
      }

      // Envoyer par email si email disponible
      if (user.email) {
        try {
          await this.notificationsService.sendEmail(
            user.email,
            'Réinitialisation de mot de passe - Back Office MediConnect',
            'password-reset-email', // Utiliser le nom du template
            templateData
          );
          this.logger.log(`Code de réinitialisation envoyé par email à ${user.email}`);
        } catch (error) {
          this.logger.error(`Erreur lors de l'envoi du code par email: ${error.message}`);
        }
      }

      // En développement, afficher le code dans les logs
      this.logger.debug(`Code de réinitialisation pour ${identifier}: ${resetToken}`);

      return {
        success: true,
        message: 'Si votre compte existe, vous recevrez un code de réinitialisation par email et/ou SMS.',
      };
    } catch (error) {
      this.logger.error(`Erreur lors de la demande de réinitialisation: ${error.message}`);
      throw new HttpException(
        'Une erreur est survenue lors de la demande de réinitialisation',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Vérifier le code de réinitialisation et modifier le mot de passe (admin)
   */
  async verifyPasswordReset(
    identifier: string,
    resetCode: string,
    newPassword: string,
    confirmPassword: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Vérifier que les mots de passe correspondent
      if (newPassword !== confirmPassword) {
        throw new BadRequestException('Les mots de passe ne correspondent pas');
      }
      
      // Verify the reset code first
      await this.verifyResetCodeOnly(identifier, resetCode);

      // Vérifier la robustesse du mot de passe (exemple : longueur minimale)
      const MIN_PASSWORD_LENGTH = 8;
      if (newPassword.length < MIN_PASSWORD_LENGTH) {
        throw new BadRequestException(`Le mot de passe doit contenir au moins ${MIN_PASSWORD_LENGTH} caractères.`);
      }
      // D'autres vérifications de robustesse peuvent être ajoutées ici (majuscules, chiffres, symboles)

      let user = null;
      
      // Vérifier si l'identifiant est un email ou un nom d'utilisateur
      if (identifier.includes('@')) {
        // C'est un email
        const usersFound = await this.databaseService.db
          .select()
          .from(users)
          .where(
            and(
              eq(users.email, identifier),
              eq(users.is_active, true)
            )
          );
        
        if (usersFound.length > 0) {
          user = usersFound[0];
        }
      } else {
        // C'est un nom d'utilisateur
        const usersFound = await this.databaseService.db
          .select()
          .from(users)
          .where(
            and(
              eq(users.username, identifier),
              eq(users.is_active, true)
            )
          );
        
        if (usersFound.length > 0) {
          user = usersFound[0];
        }
      }

      if (!user) {
        throw new UnauthorizedException('Utilisateur non trouvé');
      }

      // Le code a déjà été vérifié par verifyResetCodeOnly() au début de cette méthode
      // On peut directement passer à la mise à jour du mot de passe
      
      // Rechercher le token de réinitialisation pour cet utilisateur à des fins de nettoyage
      let validResetId: string | undefined;
      let validResetData: StoredOtp | undefined;

      for (const [resetId, resetData] of this.passwordResetStore.entries()) {
        if (resetId.startsWith(identifier) && resetData.otp === resetCode && resetData.userId === user.id) {
          validResetId = resetId;
          validResetData = resetData;
          break;
        }
      }
      
      if (!validResetId || !validResetData) {
        // Ne devrait pas arriver car déjà vérifié dans verifyResetCodeOnly
        throw new UnauthorizedException('Code de réinitialisation invalide ou expiré');
      }

      if (validResetData.expires < new Date()) {
        this.passwordResetStore.delete(validResetId);
        throw new UnauthorizedException('Code de réinitialisation expiré');
      }

      // Vérifier les tentatives
      validResetData.attempts += 1;
      if (validResetData.attempts > 3) {
        this.passwordResetStore.delete(validResetId);
        throw new UnauthorizedException('Trop de tentatives échouées. Veuillez demander un nouveau code.');
      }

      // Code valide, supprimer de la mémoire
      this.passwordResetStore.delete(validResetId);

      // Hasher le nouveau mot de passe
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(newPassword, saltRounds);

      // Mettre à jour le mot de passe
      await this.databaseService.db
        .update(users)
        .set({
          password_hash: passwordHash,
          updated_at: new Date(),
        })
        .where(eq(users.id, user.id));

      this.logger.log(`Mot de passe réinitialisé avec succès pour l'utilisateur ${user.id}`);

      return {
        success: true,
        message: 'Votre mot de passe a été réinitialisé avec succès. Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.',
      };
    } catch (error) {
      if (error instanceof UnauthorizedException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Erreur lors de la vérification du code de réinitialisation: ${error.message}`);
      throw new HttpException(
        'Une erreur est survenue lors de la réinitialisation du mot de passe',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Vérifier uniquement le code de réinitialisation sans changer le mot de passe
   * @param identifier Email ou nom d'utilisateur
   * @param resetCode Code de réinitialisation
   * @returns Message de succès si le code est valide
   */
  async verifyResetCodeOnly(
    identifier: string,
    resetCode: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      let user = null;
      
      // Vérifier si l'identifiant est un email ou un nom d'utilisateur
      if (identifier.includes('@')) {
        // C'est un email
        const usersFound = await this.databaseService.db
          .select()
          .from(users)
          .where(
            and(
              eq(users.email, identifier),
              eq(users.is_active, true)
            )
          );
        
        if (usersFound.length > 0) {
          user = usersFound[0];
        }
      } else {
        // C'est un nom d'utilisateur
        const usersFound = await this.databaseService.db
          .select()
          .from(users)
          .where(
            and(
              eq(users.username, identifier),
              eq(users.is_active, true)
            )
          );
        
        if (usersFound.length > 0) {
          user = usersFound[0];
        }
      }

      if (!user) {
        throw new UnauthorizedException('Utilisateur non trouvé');
      }

      // Rechercher le token de réinitialisation pour cet utilisateur
      let validResetId: string | undefined;
      let validResetData: StoredOtp | undefined;

      for (const [resetId, resetData] of this.passwordResetStore.entries()) {
        if (resetId.startsWith(identifier) && resetData.otp === resetCode && resetData.userId === user.id) {
          validResetId = resetId;
          validResetData = resetData;
          break;
        }
      }

      if (!validResetId || !validResetData) {
        throw new UnauthorizedException('Code de réinitialisation invalide ou expiré');
      }

      if (validResetData.expires < new Date()) {
        this.passwordResetStore.delete(validResetId);
        throw new UnauthorizedException('Code de réinitialisation expiré');
      }

      // Vérifier les tentatives
      validResetData.attempts += 1;
      if (validResetData.attempts > 3) {
        this.passwordResetStore.delete(validResetId);
        throw new UnauthorizedException('Trop de tentatives échouées. Veuillez demander un nouveau code.');
      }

      // Ne pas supprimer le code pour permettre de l'utiliser lors de la réinitialisation finale
      
      return {
        success: true,
        message: 'Code vérifié avec succès. Vous pouvez maintenant définir votre nouveau mot de passe.',
      };
    } catch (error) {
      if (error instanceof UnauthorizedException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Erreur lors de la vérification du code: ${error.message}`);
      throw new HttpException(
        'Une erreur est survenue lors de la vérification du code',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  
  /**
   * Authentification par mot de passe puis envoi d'un OTP à l'utilisateur
   * @param identifier Peut être un nom d'utilisateur, un email ou un numéro de téléphone
   * @param password Le mot de passe de l'utilisateur
   */
  async login(identifier: string, password: string): Promise<{ success: boolean; message: string; username?: string }> {
    try {
      this.logger.debug(`Début du processus de login pour l'identifiant: ${identifier}`);
      
      // Recherche de l'utilisateur par identifiant (username, email ou téléphone)
      this.logger.debug(`Tentative de recherche de l'utilisateur dans la base de données avec l'identifiant: ${identifier}`);
        
      // Vérifier l'état de la connexion à la base de données
      if (!this.databaseService || !this.databaseService.db) {
        this.logger.error('Service de base de données non initialisé');
        throw new Error('Service de base de données non disponible');
      }
      
      this.logger.debug('Connexion à la base de données établie, exécution de la requête');
      
      const usersFound = await this.databaseService.db
        .select()
        .from(users)
        .where(
          and(
            or(
              eq(users.username, identifier),
              eq(users.email, identifier),
              eq(users.phone, identifier)
            ),
            eq(users.is_active, true)
          )
        );
        
      this.logger.debug(`Résultat de la recherche: ${usersFound.length} utilisateur(s) trouvé(s)`);
        
      if (usersFound.length === 0) {
        this.logger.warn(`Aucun utilisateur trouvé pour l'identifiant: ${identifier}`);
        throw new UnauthorizedException('Identifiants invalides');
      }

      const user = usersFound[0];
      this.logger.debug(`Utilisateur trouvé avec ID: ${user.id}, rôle: ${user.role}`);

      // Vérifier que l'utilisateur a un rôle d'administrateur, de super admin ou de pharmacien
      // Le rôle SUPER_ADMIN est autorisé à se connecter au back-office
      const allowedRoles = ['ADMIN', 'PHARMACIST', 'PHARMACY_STAFF', 'SUPER_ADMIN'];
      if (!allowedRoles.includes(user.role)) {
        this.logger.warn(`Utilisateur avec ID ${user.id} n'a pas les permissions suffisantes (rôle: ${user.role})`);
        throw new UnauthorizedException('Permissions insuffisantes');
      }

      // Vérifier le mot de passe
      if (!user.password_hash) {
        this.logger.warn(`L'utilisateur ${user.id} n'a pas de mot de passe défini`);
        throw new UnauthorizedException('Compte incomplet, veuillez réinitialiser votre mot de passe');
      }

      try {
        this.logger.debug(`Vérification du mot de passe pour l'utilisateur ${user.id}`);
        
        // Vérifier que le hash du mot de passe est au format bcrypt
        if (!user.password_hash.startsWith('$2')) {
          this.logger.warn(`Format de hash de mot de passe non valide pour l'utilisateur ${user.id}`);
          throw new Error('Format de mot de passe non valide');
        }
        
        // Vérification du mot de passe avec bcrypt
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);
        
        if (!isPasswordValid) {
          this.logger.warn(`Mot de passe invalide pour l'utilisateur ${user.id}`);
          // Erreur d'authentification claire - ne pas traiter comme une erreur bcrypt
          throw new UnauthorizedException('Identifiants invalides');
        }
        
        this.logger.debug(`Mot de passe valide pour l'utilisateur ${user.id}`);
      } catch (error) {
        // Distinguer entre une erreur d'authentification délibérée et une erreur technique
        if (error instanceof UnauthorizedException) {
          // C'est une erreur d'authentification intentionnelle, la propager directement
          throw error;
        }
        
        // C'est une erreur technique liée à bcrypt
        this.logger.error(`Erreur technique bcrypt lors de la vérification du mot de passe: ${error.message}`);
        this.logger.error(`Détails de l'erreur bcrypt: ${error.stack || '(pas de stack)'}`);
        throw new UnauthorizedException('Erreur lors de la vérification du mot de passe');
      }

      // Générer un OTP à 6 chiffres
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Stocker l'OTP avec expiration (10 minutes)
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 10);
      
      // Utiliser le username comme clé dans le store OTP
      const storeKey = user.username;
      this.otpStore.set(storeKey, {
        otp,
        expires: expiresAt,
        attempts: 0,
        userId: user.id
      });

      // Préparer le message OTP
      const otpMessage = `Votre code de connexion au back-office MediConnect est: ${otp}. Valide pendant 10 minutes.`;
      const otpEmailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Authentification MediConnect</h2>
          <p>Bonjour ${user.first_name || user.username},</p>
          <p>Voici votre code de connexion au back-office:</p>
          <div style="background-color: #f4f4f4; padding: 12px; font-size: 24px; text-align: center; letter-spacing: 5px; font-weight: bold; border-radius: 4px; margin: 15px 0;">
            ${otp}
          </div>
          <p>Ce code est valide pendant 10 minutes.</p>
          <p>Si vous n'avez pas demandé ce code, veuillez sécuriser votre compte immédiatement.</p>
          <p>Cordialement,<br>L'équipe MediConnect</p>
        </div>
      `;

      // Envoyer par SMS si numéro disponible
      if (user.phone) {
        try {
          this.logger.debug(`Tentative d'envoi d'OTP par SMS au ${user.phone}`);
          // Option 1: Using template-based SMS
          await this.notificationsService.sendEmail(
            user.phone, // Using email function but for SMS template
            'Code de connexion MediConnect',
            'otp-sms', // Use the SMS template
            { 
              firstName: user.first_name || user.username,
              code: otp,
              validity: '10'
            }
          );
          // Fallback to direct SMS if needed
          // await this.notificationsService.sendSms(user.phone, otpMessage);
          this.logger.log(`OTP envoyé par SMS à ${user.phone}`);
        } catch (error) {
          this.logger.error(`Erreur lors de l'envoi de l'OTP par SMS: ${error.message}`, error.stack);
          // Continuer le flux d'exécution même si l'envoi par SMS échoue
        }
      } else {
        this.logger.warn(`Pas de numéro de téléphone disponible pour l'utilisateur ${user.id}`);
      }

      // Envoyer par email si disponible
      if (user.email) {
        try {
          this.logger.debug(`Tentative d'envoi d'OTP par email à ${user.email}`);
          await this.notificationsService.sendEmail(
            user.email,
            'Code de connexion MediConnect',
            'otp-email', // Use the template name instead of inline HTML
            { 
              firstName: user.first_name || user.username,
              code: otp,
              validity: '10',
              year: new Date().getFullYear()
            }
          );
          this.logger.log(`OTP envoyé par email à ${user.email}`);
        } catch (error) {
          this.logger.error(`Erreur lors de l'envoi de l'OTP par email: ${error.message}`, error.stack);
          // Continuer le flux d'exécution même si l'envoi par email échoue
        }
      } else {
        this.logger.warn(`Pas d'email disponible pour l'utilisateur ${user.id}`);
      }

      // En développement, afficher l'OTP dans les logs
      this.logger.debug(`OTP pour ${user.username}: ${otp}`);

      return {
        success: true,
        message: 'Un code de vérification a été envoyé. Veuillez le saisir pour vous connecter.',
        username: user.username // Ajouter le nom d'utilisateur pour la prochaine étape (vérification OTP)
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        this.logger.warn(`Accès non autorisé: ${error.message}`);
        throw error;
      }
      
      // Journaliser l'erreur avec plus de détails
      this.logger.error(`Erreur lors de l'authentification: ${error.message}`);
      
      if (error.stack) {
        this.logger.error(`Stack trace: ${error.stack}`);
      }
      
      // Capturer les erreurs de base de données ou de connection
      if (typeof error === 'object') {
        // Log des propriétés de l'erreur pour aider au diagnostic
        this.logger.error(`Type d'erreur: ${error.constructor ? error.constructor.name : 'unknown'}`);
        
        if (error.code) {
          this.logger.error(`Code d'erreur: ${error.code}`);
        }
        
        if (error.errno) {
          this.logger.error(`Errno: ${error.errno}`);
        }
        
        if (error.sqlState) {
          this.logger.error(`État SQL: ${error.sqlState}`);
        }
        
        if (error.sqlMessage) {
          this.logger.error(`Message SQL: ${error.sqlMessage}`);
        }
      }
      
      // Création d'une réponse d'erreur plus informative pour le débogage
      throw new HttpException(
        {
          message: 'Une erreur est survenue lors de la connexion',
          error: process.env.NODE_ENV !== 'production' ? error.message : undefined,
          timestamp: new Date().toISOString(),
        }, 
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Méthode pour gérer la déconnexion et l'invalidation du token JWT
   * @param token Le token JWT à invalider
   */
  async logout(token: string): Promise<{ success: boolean; message: string }> {
    try {
      if (!token) {
        return { success: true, message: 'Déconnexion réussie' };
      }

      // Décodage du token pour récupérer les informations utilisateur
      try {
        const decodedToken = this.jwtService.verify(token);
        const userId = decodedToken.sub;
        
        if (userId) {
          // Ajout du token à une liste de tokens invalidés (blacklist)
          await this.invalidateToken(token, decodedToken.exp);
          
          // Journaliser la déconnexion
          this.logger.log(`Utilisateur ID:${userId} déconnecté avec succès`);
          
          // Ici, vous pourriez également mettre à jour la dernière date de connexion
          // ou effectuer d'autres opérations liées à la déconnexion
        }
      } catch (error) {
        // Le token est peut-être déjà invalide ou expiré
        this.logger.warn(`Tentative de déconnexion avec un token invalide: ${error.message}`);
      }

      return {
        success: true,
        message: 'Déconnexion réussie',
      };
    } catch (error) {
      this.logger.error(`Erreur lors de la déconnexion: ${error.message}`);
      throw new HttpException(
        'Erreur lors de la déconnexion',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
  
  /**
   * Ajoute un token à la liste des tokens invalidés (blacklist)
   * @param token Le token à invalider
   * @param expiryTime La date d'expiration du token
   */
  private async invalidateToken(token: string, expiryTime: number): Promise<void> {
    try {
      // Utiliser le service dédié pour ajouter le token à la blacklist
      await this.tokenBlacklistService.addToBlacklist(token, expiryTime);
      
      // Journalisation
      this.logger.log('Token invalidé avec succès');
    } catch (error) {
      this.logger.error(`Erreur lors de l'invalidation du token: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Nettoie les tokens expirés de la blacklist
   */
  // Le nettoyage des tokens expirés est maintenant géré par le TokenBlacklistService

  /**
   * Vérifier si un token est dans la blacklist (a été invalidé)
   * Cette méthode serait utilisée par un guard JWT personnalisé
   */
  async isTokenInvalidated(token: string): Promise<boolean> {
    // Utiliser le service dédié pour vérifier si le token est blacklisté
    return await this.tokenBlacklistService.isBlacklisted(token);
  }

  /**
   * Rafraîchit un token JWT avant son expiration
   * @param token Le token JWT à rafraîchir
   * @returns Un nouveau token JWT et sa date d'expiration
   */
  async refreshToken(token: string): Promise<{ token: string; expiresAt: string }> {
    try {
      // Vérifier si le token est dans la liste noire
      const isBlacklisted = await this.tokenBlacklistService.isBlacklisted(token);
      if (isBlacklisted) {
        this.logger.warn('Tentative de rafraîchissement d\'un token blacklisté');
        throw new UnauthorizedException('Token invalide');
      }

      // Décoder le token
      let payload;
      try {
        payload = this.jwtService.verify(token);
      } catch (error) {
        this.logger.error(`Erreur de vérification du token: ${error.message}`);
        throw new UnauthorizedException('Token invalide ou expiré');
      }

      // Récupérer l'utilisateur
      const user = await this.databaseService.db
        .select()
        .from(users)
        .where(eq(users.id, payload.sub))
        .limit(1);

      if (user.length === 0 || !user[0].is_active) {
        throw new UnauthorizedException('Utilisateur introuvable ou inactif');
      }

      // Mettre le token actuel sur liste noire
      const decodedToken = this.jwtService.decode(token);
      if (typeof decodedToken === 'object' && decodedToken !== null && decodedToken.exp) {
        await this.tokenBlacklistService.addToBlacklist(token, decodedToken.exp);
      } else {
        this.logger.warn('Impossible de décoder le token pour récupérer l\'expiration');
      }

      // Générer un nouveau token
      const newPayload = {
        sub: user[0].id,
        username: user[0].username,
        email: user[0].email,
        role: user[0].role,
      };

      const expiresIn = 60 * 60; // 1 heure
      const newToken = this.jwtService.sign(newPayload, { expiresIn });
      
      // Calculer la date d'expiration
      const expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + expiresIn);

      return {
        token: newToken,
        expiresAt: expiresAt.toISOString()
      };
    } catch (error) {
      this.logger.error(`Erreur lors du rafraîchissement du token: ${error.message}`);
      throw error;
    }
  }
}