import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class TokenRefreshInterceptor implements NestInterceptor {
  constructor(private readonly jwtService: JwtService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    return next.handle().pipe(
      tap(() => {
        const token = this.extractTokenFromHeader(request);
        if (!token) {
          return;
        }

        try {
          // Décoder le token pour obtenir l'heure d'expiration
          const decoded = this.jwtService.decode(token);
          if (!decoded || typeof decoded !== 'object') {
            return;
          }

          const expirationTime = decoded.exp * 1000; // convertir en millisecondes
          const now = Date.now();
          
          // Si le token expire dans moins de 15 minutes, générer un nouveau token
          const fifteenMinutesInMs = 15 * 60 * 1000;
          if (expirationTime - now < fifteenMinutesInMs) {
            // Créer un nouveau token avec les mêmes informations mais une nouvelle date d'expiration
            const newToken = this.jwtService.sign({
              sub: decoded.sub,
              username: decoded.username,
              role: decoded.role,
              // Autres propriétés importantes...
            });

            // Ajouter le nouveau token dans la réponse
            response.header('X-New-Token', newToken);
          }
        } catch (error) {
          // Ne rien faire en cas d'erreur, simplement ne pas rafraîchir le token
          console.error('Erreur lors du rafraîchissement du token:', error);
        }
      }),
    );
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
