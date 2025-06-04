import { Injectable, UnauthorizedException, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';
import { TokenBlacklistService } from '../services/token-blacklist.service';

@Injectable()
export class JwtBlacklistGuard extends AuthGuard('jwt') {
  constructor(private readonly tokenBlacklistService: TokenBlacklistService) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Appel du guard JWT standard en premier
    const jwtActivation = await super.canActivate(context);
    
    if (!jwtActivation) {
      return false;
    }

    // Le guard JWT standard a validé le token, maintenant vérifier s'il est blacklisté
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('Token d\'authentification non fourni');
    }

    // Vérifier si le token est dans la blacklist
    const isTokenInvalidated = await this.tokenBlacklistService.isBlacklisted(token);
    
    if (isTokenInvalidated) {
      throw new UnauthorizedException('Session expirée ou déconnectée');
    }

    // Token valide et non blacklisté
    return true;
  }

  private extractTokenFromHeader(request: any): string | null {
    const authHeader = request.headers.authorization;
    if (!authHeader) {
      return null;
    }
    const [type, token] = authHeader.split(' ');
    return type === 'Bearer' ? token : null;
  }
}
