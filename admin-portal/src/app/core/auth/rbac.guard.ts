import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { RbacService } from './rbac.service';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class RbacGuard implements CanActivate {
  constructor(
    private rbacService: RbacService,
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    // Si l'utilisateur n'est pas connecté, rediriger vers la page de connexion
    if (!this.authService.isLoggedIn()) {
      return this.router.createUrlTree(['/login'], {
        queryParams: { returnUrl: state.url }
      });
    }

    // Vérifier si l'utilisateur a les permissions nécessaires pour accéder à cette route
    const canAccess = this.rbacService.canAccessRoute(state.url);
    
    if (!canAccess) {
      // Rediriger vers la page d'accès refusé
      return this.router.createUrlTree(['/admin/access-denied']);
    }
    
    return true;
  }
}