import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../../../redis/redis.service';
import * as bcrypt from 'bcrypt';

/**
 * Service responsable de la gestion des tokens JWT invalidés
 * Cette implémentation utilise Redis pour un stockage persistant et distribué
 */
@Injectable()
export class TokenBlacklistService {
  private readonly logger = new Logger(TokenBlacklistService.name);
  private readonly TOKEN_BLACKLIST_PREFIX = 'token:blacklist:';
  
  constructor(private readonly redisService: RedisService) {}
  
  /**
   * Ajoute un token à la blacklist
   */
  async addToBlacklist(token: string, expiryTime: number): Promise<void> {
    try {
      // Hacher le token avant de le stocker pour des raisons de sécurité
      const tokenHash = await this.hashToken(token);
      const key = `${this.TOKEN_BLACKLIST_PREFIX}${tokenHash}`;
      
      // Calculer le TTL en secondes (durée jusqu'à l'expiration)
      const now = Math.floor(Date.now() / 1000);
      const ttl = expiryTime - now;
      
      if (ttl <= 0) {
        this.logger.debug('Token déjà expiré, pas besoin de le blacklister');
        return;
      }

      // Stocker le token avec un TTL automatique pour qu'il soit supprimé à expiration
      await this.redisService.set(key, 'blacklisted', ttl);
      this.logger.debug(`Token blacklisté avec succès pour ${ttl} secondes (expire à: ${new Date(expiryTime * 1000).toISOString()})`);
    } catch (error) {
      this.logger.error(`Erreur lors de l'ajout du token à la blacklist: ${error.message}`);
      throw new Error('Impossible d\'invalider le token');
    }
  }
  
  /**
   * Vérifie si un token est dans la blacklist
   */
  async isBlacklisted(token: string): Promise<boolean> {
    try {
      // Vérifier via Redis si le token est blacklisté
      // Pour ce faire, nous devons comparer avec tous les hashs stockés
      const pattern = `${this.TOKEN_BLACKLIST_PREFIX}*`;
      const keys = await this.getKeysWithPattern(pattern);
      
      if (!keys || keys.length === 0) {
        return false;
      }
      
      for (const key of keys) {
        // Extraire le hash de la clé
        const hash = key.replace(this.TOKEN_BLACKLIST_PREFIX, '');
        
        // Comparer le token avec le hash
        const match = await bcrypt.compare(token, hash);
        if (match) {
          this.logger.debug('Token trouvé dans la liste noire');
          return true;
        }
      }
      
      return false;
    } catch (error) {
      this.logger.error(`Erreur lors de la vérification du token blacklisté: ${error.message}`);
      // En cas d'erreur de vérification, on rejette par sécurité
      return true;
    }
  }
  
  /**
   * Récupère les clés correspondant à un pattern Redis
   */
  private async getKeysWithPattern(pattern: string): Promise<string[]> {
    try {
      return await this.redisService.getClient().keys(pattern);
    } catch (error) {
      this.logger.error(`Erreur lors de la récupération des clés avec pattern ${pattern}: ${error.message}`);
      return [];
    }
  }
  
  /**
   * Hache un token JWT pour un stockage sécurisé dans la blacklist
   */
  private async hashToken(token: string): Promise<string> {
    // Utiliser bcrypt pour une sécurité renforcée
    // Coût de hachage faible car ces hash sont temporaires
    return bcrypt.hash(token, 5);
  }
}
