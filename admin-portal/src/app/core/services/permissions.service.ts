import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Role } from '../../core/auth/rbac.model';

@Injectable({
  providedIn: 'root'
})
export class PermissionsService {
  private apiUrl = `${environment.apiUrl}/api/v1/api/admin/permissions`;

  constructor(private http: HttpClient) { }

  /**
   * Récupérer toutes les permissions disponibles dans le système
   */
  getAllPermissions(): Observable<any> {
    return this.http.get(`${this.apiUrl}`);
  }

  /**
   * Récupérer les permissions pour un rôle spécifique
   * @param role Le rôle pour lequel obtenir les permissions
   */
  getPermissionsByRole(role: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/role/${role}`);
  }

  /**
   * Mettre à jour les permissions pour un rôle
   * @param role Le rôle à mettre à jour
   * @param permissionIds Liste des IDs de permissions à attribuer
   */
  updateRolePermissions(role: string, permissionIds: number[]): Observable<any> {
    return this.http.post(`${this.apiUrl}/role/${role}`, { permissionIds });
  }

  /**
   * Récupérer les permissions pour un utilisateur spécifique
   * @param userId ID de l'utilisateur
   */
  getUserPermissions(userId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/user/${userId}`);
  }

  /**
   * Mettre à jour les permissions spécifiques à un utilisateur
   * @param userId ID de l'utilisateur
   * @param permissions Objet contenant les permissions à ajouter ou retirer
   */
  updateUserPermissions(userId: number, permissions: { 
    addPermissionIds: number[], 
    removePermissionIds: number[] 
  }): Observable<any> {
    return this.http.post(`${this.apiUrl}/user/${userId}`, permissions);
  }
}
