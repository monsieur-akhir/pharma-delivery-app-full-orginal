import {
  Controller,
  Post,
  Body,
  HttpException,
  HttpStatus,
  Req,
  UseGuards,
  UnauthorizedException,
  Logger
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtService } from '@nestjs/jwt';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { AuthService } from '../auth.service';

@ApiTags('auth-mobile')
@Controller('auth/mobile')
export class MobileAuthController {
  private readonly logger = new Logger(MobileAuthController.name);

  constructor(
    private readonly authService: AuthService, 
    private readonly jwtService: JwtService
  ) {}

  @Post('refresh-token')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Rafraîchir un token d\'authentification pour l\'app mobile' })
  @ApiResponse({ status: 200, description: 'Token rafraîchi avec succès' })
  @ApiResponse({ status: 401, description: 'Token invalide ou expiré' })
  async refreshToken(@Req() request: Request) {
    try {
      const authHeader = request.headers['authorization'];
      if (!authHeader) {
        throw new UnauthorizedException('Token manquant');
      }

      const token = authHeader.split(' ')[1];
      
      // Vérifier le token
      let decoded;
      try {
        decoded = this.jwtService.verify(token);
      } catch (error) {
        throw new UnauthorizedException('Token invalide ou expiré');
      }

      // Génération d'un nouveau token
      const { sub, role, phone } = decoded;
      const newToken = this.jwtService.sign({
        sub,
        role,
        phone,
        refreshed: true,
        refreshedAt: new Date().toISOString()
      });

      return {
        token: newToken,
        message: 'Token rafraîchi avec succès'
      };
    } catch (error) {
      this.logger.error(`Erreur lors du rafraîchissement du token: ${error.message}`);
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new HttpException(
        'Erreur lors du rafraîchissement du token',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('logout')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Déconnexion et invalidation du token pour l\'app mobile' })
  async logout(@Body() body: any, @Req() request: Request) {
    try {
      const authHeader = request.headers['authorization'];
      const token = authHeader?.split(' ')[1];
      
      if (token) {
        try {
          // Décodage du token pour récupérer les informations
          const decodedToken = this.jwtService.verify(token);
          const userId = decodedToken.sub;
          
          this.logger.log(`Utilisateur mobile ID:${userId} déconnecté avec succès`);
        } catch (error) {
          this.logger.warn(`Tentative de déconnexion avec un token invalide: ${error.message}`);
        }
      }

      return {
        success: true,
        message: 'Déconnecté avec succès'
      };
    } catch (error) {
      this.logger.error(`Erreur lors de la déconnexion: ${error.message}`);
      throw new HttpException(
        'Erreur lors de la déconnexion',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
