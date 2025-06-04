import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PermissionsService {
  private apiUrl = `${environment.apiUrl}/v1/admin/permissions`;

  constructor(private http: HttpClient) { }

  /**
   * Récupère toutes les permissions du système
   */
  getAllPermissions(): Observable<any> {
    return this.http.get(`${this.apiUrl}`);
  }

  /**
   * Récupère les permissions associées à un rôle spécifique
   * @param role Le rôle à vérifier
   */
  getPermissionsByRole(role: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/role/${role}`);
  }

  /**
   * Récupère les permissions pour un utilisateur spécifique
   * @param userId ID de l'utilisateur
   */
  getUserPermissions(userId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/user/${userId}`);
  }

  /**
   * Met à jour les permissions pour un rôle
   * @param role Le rôle à modifier
   * @param permissionIds IDs des permissions à accorder au rôle
   */
  updateRolePermissions(role: string, permissionIds: number[]): Observable<any> {
    return this.http.post(`${this.apiUrl}/role/${role}`, { permissionIds });
  }

  /**
   * Définit une dérogation de permission pour un utilisateur
   * @param userId ID de l'utilisateur
   * @param permissionId ID de la permission
   * @param granted Si la permission est accordée (true) ou refusée (false)
   */
  setUserPermission(userId: number, permissionId: number, granted: boolean): Observable<any> {
    return this.http.post(`${this.apiUrl}/user/${userId}/permission/${permissionId}`, { granted });
  }

  /**
   * Supprime une dérogation de permission pour un utilisateur
   * @param userId ID de l'utilisateur
   * @param permissionId ID de la permission
   */
  removeUserPermission(userId: number, permissionId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/user/${userId}/permission/${permissionId}`);
  }

  /**
   * Vérifie si l'utilisateur actuellement connecté possède une permission spécifique
   * @param permissionName Nom de la permission à vérifier
   */
  checkPermission(permissionName: string): Observable<{hasPermission: boolean}> {
    return this.http.get<{hasPermission: boolean}>(`${this.apiUrl}/check/${permissionName}`);
  }
}
