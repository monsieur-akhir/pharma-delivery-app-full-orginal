import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService, User } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard {
  constructor(private router: Router, private authService: AuthService) {}

  canActivate(route: any): boolean {
    // Check if user is logged in
    if (this.authService.isLoggedIn) {
      // Check if role is required for the route
      const requiredRole = route.data?.requiredRole;
      
      // If required role exists, check if user has that role
      if (requiredRole && !this.checkUserRole(requiredRole)) {
        // If no required role, navigate to unauthorized page
        this.router.navigate(['/unauthorized']);
        return false;
      }
      
      // User is logged in and has the required role
      return true;
    }
    
    // User is not logged in, redirect to login page with the current route as the return URL
    const currentUrl = this.router.url || route.url;
    this.router.navigate(['/auth'], { queryParams: { returnUrl: currentUrl } });
    return false;
  }
  
  private checkUserRole(requiredRole: string | string[]): boolean {
    const user = this.authService.currentUser;
    if (!user) return false;
    
    // SUPER_ADMIN can access everything
    if (user.role === 'SUPER_ADMIN') {
      return true;
    }
    
    // Handle array of roles
    if (Array.isArray(requiredRole)) {
      return requiredRole.includes(user.role);
    }
    
    // Handle single role
    return user.role === requiredRole;
  }
}