import { Controller, Post, Body, HttpException, HttpStatus, Logger, Req } from '@nestjs/common';
import { AdminAuthService } from './admin-auth.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { RequestOtpAdminDto } from './dto/request-otp.dto';
import { VerifyOtpAdminDto } from './dto/verify-otp.dto';
import { RequestPasswordResetAdminDto } from './dto/request-password-reset.dto';
import { VerifyPasswordResetAdminDto } from './dto/verify-password-reset.dto';
import { LoginDto } from './dto/login.dto';
import { Request } from 'express';

@ApiTags('admin/auth')
@Controller('admin/auth')
export class AdminAuthController {
  private readonly logger = new Logger(AdminAuthController.name);
  
  constructor(private readonly adminAuthService: AdminAuthService) {}
  
  @Post('diagnostic')
  @ApiOperation({ summary: 'Endpoint de diagnostic pour vérifier la connectivité' })
  async diagnoseDatabaseConnection() {
    try {
      this.logger.log('Requête de diagnostic reçue');
      return await this.adminAuthService.diagnoseDatabaseConnection();
    } catch (error) {
      this.logger.error(`Erreur lors du diagnostic: ${error.message}`);
      throw new HttpException(
        { message: 'Erreur lors du diagnostic', details: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  
  @Post('ping')
  @ApiOperation({ summary: 'Endpoint simple pour tester la connectivité API' })
  async ping(@Body() body: any) {
    try {
      this.logger.log(`Ping reçu avec corps: ${JSON.stringify(body)}`);
      return {
        success: true,
        message: 'API connectée et fonctionnelle',
        timestamp: new Date().toISOString(),
        receivedData: body
      };
    } catch (error) {
      this.logger.error(`Erreur lors du ping: ${error.message}`);
      throw new HttpException(
        'Erreur lors du traitement du ping',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('login')
  @ApiOperation({ summary: 'Se connecter avec identifiant et mot de passe pour recevoir un OTP' })
  @ApiResponse({ status: 200, description: 'OTP envoyé avec succès' })
  @ApiResponse({ status: 401, description: 'Identifiants invalides ou permissions insuffisantes' })
  @ApiResponse({ status: 500, description: 'Erreur serveur' })
  async login(@Body() loginDto: LoginDto) {
    try {
      this.logger.log(`Tentative de connexion pour: ${loginDto.identifier}`);
      
      // Journalisation des données de la requête
      this.logger.debug(`Données de connexion reçues: ${JSON.stringify({
        identifier: loginDto.identifier,
        hasPassword: !!loginDto.password
      })}`);
      
      return await this.adminAuthService.login(loginDto.identifier, loginDto.password);
    } catch (error) {
      // Journalisation détaillée de l'erreur
      this.logger.error(`Erreur lors de la connexion: ${error.message}`);
      
      if (error.stack) {
        this.logger.error(`Stack trace: ${error.stack}`);
      }
      
      throw new HttpException(
        error.message || 'Échec de l\'authentification',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('request-otp')
  @ApiOperation({ summary: 'Demander un code OTP pour la connexion admin' })
  @ApiResponse({ status: 200, description: 'OTP envoyé avec succès par email et SMS' })
  @ApiResponse({ status: 401, description: 'Utilisateur non trouvé ou permissions insuffisantes' })
  @ApiResponse({ status: 500, description: 'Erreur serveur' })
  async requestOtp(@Body() requestOtpDto: RequestOtpAdminDto) {
    try {
      this.logger.log(`Demande d'OTP pour l'utilisateur: ${requestOtpDto.username}`);
      return await this.adminAuthService.requestOtp(requestOtpDto.username);
    } catch (error) {
      this.logger.error(`Erreur lors de la demande d'OTP: ${error.message}`);
      throw new HttpException(
        error.message || 'Échec de la demande de code',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('verify-otp')
  @ApiOperation({ summary: 'Vérifier un code OTP et se connecter' })
  @ApiResponse({ status: 200, description: 'Vérification réussie et token retourné' })
  @ApiResponse({ status: 401, description: 'OTP invalide ou expiré' })
  @ApiResponse({ status: 500, description: 'Erreur serveur' })
  async verifyOtp(@Body() verifyOtpDto: VerifyOtpAdminDto) {
    try {
      this.logger.log(`Vérification d'OTP pour l'utilisateur: ${verifyOtpDto.username}`);
      return await this.adminAuthService.verifyOtp(
        verifyOtpDto.username,
        verifyOtpDto.otp
      );
    } catch (error) {
      this.logger.error(`Erreur lors de la vérification d'OTP: ${error.message}`);
      throw new HttpException(
        error.message || 'Échec de la vérification du code',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('request-password-reset')
  @ApiOperation({ summary: 'Demander une réinitialisation de mot de passe (admin)' })
  @ApiResponse({ status: 200, description: 'Demande traitée avec succès' })
  @ApiResponse({ status: 500, description: 'Erreur serveur' })
  async requestPasswordReset(@Body() dto: RequestPasswordResetAdminDto) {
    try {
      this.logger.log(`Demande de réinitialisation de mot de passe pour: ${dto.identifier}`);
      return await this.adminAuthService.requestPasswordReset(dto.identifier, dto.redirectUrl);
    } catch (error) {
      this.logger.error(`Erreur lors de la demande de réinitialisation: ${error.message}`);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Erreur lors de la réinitialisation: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('verify-password-reset')
  @ApiOperation({ summary: 'Vérifier le code et réinitialiser le mot de passe (admin)' })
  @ApiResponse({ status: 200, description: 'Mot de passe réinitialisé avec succès' })
  @ApiResponse({ status: 400, description: 'Requête invalide' })
  @ApiResponse({ status: 401, description: 'Code invalide ou expiré' })
  @ApiResponse({ status: 500, description: 'Erreur serveur' })
  async verifyPasswordReset(@Body() dto: VerifyPasswordResetAdminDto) {
    try {
      if (dto.newPassword !== dto.confirmPassword) {
        throw new HttpException(
          'Les mots de passe ne correspondent pas',
          HttpStatus.BAD_REQUEST,
        );
      }

      this.logger.log(`Vérification du code de réinitialisation pour: ${dto.identifier}`);
      // Ne pas logger les mots de passe
      return await this.adminAuthService.verifyPasswordReset(
        dto.identifier,
        dto.resetCode,
        dto.newPassword,
        dto.confirmPassword,
      );
    } catch (error) {
      this.logger.error(`Erreur lors de la vérification du code: ${error.message}`);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Erreur lors de la réinitialisation: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('verify-reset-code')
  @ApiOperation({ summary: 'Vérifier le code de réinitialisation sans changer le mot de passe' })
  @ApiResponse({ status: 200, description: 'Code valide' })
  @ApiResponse({ status: 401, description: 'Code invalide ou expiré' })
  @ApiResponse({ status: 500, description: 'Erreur serveur' })
  async verifyResetCode(@Body() dto: { identifier: string; resetCode: string }) {
    try {
      this.logger.log(`Vérification du code de réinitialisation pour: ${dto.identifier}`);
      
      // On utilise la même méthode mais on arrête avant de changer le mot de passe
      return await this.adminAuthService.verifyResetCodeOnly(dto.identifier, dto.resetCode);
    } catch (error) {
      this.logger.error(`Erreur lors de la vérification du code: ${error.message}`);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Erreur lors de la vérification: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('logout')
  @ApiOperation({ summary: 'Déconnexion et invalidation du token' })
  @ApiResponse({ status: 200, description: 'Déconnexion réussie' })
  @ApiResponse({ status: 500, description: 'Erreur serveur' })
  async logout(@Body() body: any, @Req() request: Request) {
    try {
      // Extraction du token depuis l'en-tête Authorization
      const authHeader = request.headers['authorization'];
      const token = authHeader?.split(' ')[1]; // Format "Bearer TOKEN"
      
      if (token) {
        // Appel au service pour invalider le token
        return await this.adminAuthService.logout(token);
      } else {
        this.logger.warn('Tentative de déconnexion sans token');
        return {
          success: true,
          message: 'Déconnecté avec succès'
        };
      }
    } catch (error) {
      this.logger.error(`Erreur lors de la déconnexion: ${error.message}`);
      throw new HttpException(
        'Erreur lors de la déconnexion',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('refresh-token')
  @ApiOperation({ summary: 'Rafraîchir un token JWT avant son expiration' })
  @ApiResponse({ status: 200, description: 'Token rafraîchi avec succès' })
  @ApiResponse({ status: 401, description: 'Token invalide ou expiré' })
  async refreshToken(@Req() request: Request) {
    try {
      const authHeader = request.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new HttpException('Token manquant ou invalide', HttpStatus.UNAUTHORIZED);
      }

      const token = authHeader.split(' ')[1];
      this.logger.log('Tentative de rafraîchissement de token');
      
      return await this.adminAuthService.refreshToken(token);
    } catch (error) {
      this.logger.error(`Erreur lors du rafraîchissement du token: ${error.message}`);
      throw new HttpException(
        error.message || 'Échec du rafraîchissement du token',
        error.status || HttpStatus.UNAUTHORIZED,
      );
    }
  }
}