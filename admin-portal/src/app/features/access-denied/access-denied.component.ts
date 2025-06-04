import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { Role } from '../../core/auth/rbac.model';

@Component({
  selector: 'app-access-denied',
  templateUrl: './access-denied.component.html',
  styleUrls: ['./access-denied.component.scss']
})
export class AccessDeniedComponent implements OnInit {
  currentUserRole: string | null = null;
  
  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const currentUser = this.authService.currentUserValue;
    if (currentUser) {
      this.currentUserRole = currentUser.role;
    }
  }

  /**
   * Retourner à la page d'accueil ou au tableau de bord
   */
  goToDashboard(): void {
    this.router.navigate(['/admin/dashboard']);
  }

  /**
   * Retourner à la page précédente
   */
  goBack(): void {
    window.history.back();
  }
}