import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../auth/auth.service';

/**
 * Types d'action pour le journal d'audit
 */
export enum AuditAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  APPROVE = 'APPROVE',
  REJECT = 'REJECT',
  ENABLE = 'ENABLE',
  DISABLE = 'DISABLE',
  RESET = 'RESET',
  EXPORT = 'EXPORT',
  VIEW_SENSITIVE = 'VIEW_SENSITIVE'
}

/**
 * Types d'entité pour le journal d'audit
 */
export enum AuditEntityType {
  USER = 'USER',
  PHARMACY = 'PHARMACY',
  MEDICINE = 'MEDICINE',
  ORDER = 'ORDER',
  PRESCRIPTION = 'PRESCRIPTION',
  AI_SETTING = 'AI_SETTING',
  SYSTEM = 'SYSTEM',
  PAYMENT = 'PAYMENT'
}

/**
 * Entrée de journal d'audit
 */
export interface AuditLogEntry {
  action: AuditAction;
  entityType: AuditEntityType;
  entityId?: number | string;
  details: string;
  metadata?: Record<string, any>;
}

@Injectable({
  providedIn: 'root'
})
export class AuditLoggerService {
  private apiUrl = `${environment.apiUrl}/v1/admin/audit-logs`;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  /**
   * Journaliser une action sensible
   */
  log(entry: AuditLogEntry): Observable<any> {
    const currentUser = this.authService.currentUserValue;
    
    // Préparer les données du journal
    const logData = {
      ...entry,
      userId: currentUser?.id,
      timestamp: new Date().toISOString()
    };
    
    return this.http.post(this.apiUrl, logData);
  }

  /**
   * Journaliser une modification de rôle utilisateur
   */
  logRoleChange(userId: number, oldRole: string, newRole: string): Observable<any> {
    return this.log({
      action: AuditAction.UPDATE,
      entityType: AuditEntityType.USER,
      entityId: userId,
      details: `Rôle utilisateur modifié de "${oldRole}" à "${newRole}"`,
      metadata: {
        oldRole,
        newRole
      }
    });
  }

  /**
   * Journaliser l'approbation/rejet d'une pharmacie
   */
  logPharmacyStatusChange(
    pharmacyId: number, 
    oldStatus: string, 
    newStatus: string, 
    reason?: string
  ): Observable<any> {
    const action = newStatus === 'APPROVED' ? AuditAction.APPROVE : AuditAction.REJECT;
    
    return this.log({
      action,
      entityType: AuditEntityType.PHARMACY,
      entityId: pharmacyId,
      details: `Statut de pharmacie modifié de "${oldStatus}" à "${newStatus}"${reason ? `. Raison: ${reason}` : ''}`,
      metadata: {
        oldStatus,
        newStatus,
        reason
      }
    });
  }

  /**
   * Journaliser une modification de paramètre IA
   */
  logAiSettingChange(
    settingKey: string, 
    oldValue: any, 
    newValue: any
  ): Observable<any> {
    return this.log({
      action: AuditAction.UPDATE,
      entityType: AuditEntityType.AI_SETTING,
      entityId: settingKey,
      details: `Paramètre IA "${settingKey}" modifié de "${oldValue}" à "${newValue}"`,
      metadata: {
        key: settingKey,
        oldValue,
        newValue
      }
    });
  }

  /**
   * Journaliser une réinitialisation de paramètre IA
   */
  logAiSettingReset(settingKey: string, defaultValue: any): Observable<any> {
    return this.log({
      action: AuditAction.RESET,
      entityType: AuditEntityType.AI_SETTING,
      entityId: settingKey,
      details: `Paramètre IA "${settingKey}" réinitialisé à sa valeur par défaut "${defaultValue}"`,
      metadata: {
        key: settingKey,
        defaultValue
      }
    });
  }

  /**
   * Journaliser une action de remboursement
   */
  logPaymentRefund(
    orderId: number, 
    amount: number, 
    reason: string
  ): Observable<any> {
    return this.log({
      action: AuditAction.UPDATE,
      entityType: AuditEntityType.PAYMENT,
      entityId: orderId,
      details: `Remboursement de ${amount} XOF pour la commande #${orderId}. Raison: ${reason}`,
      metadata: {
        orderId,
        amount,
        reason,
        type: 'refund'
      }
    });
  }

  /**
   * Journaliser l'accès à des données sensibles
   */
  logSensitiveDataAccess(
    entityType: AuditEntityType, 
    entityId: number | string, 
    dataType: string
  ): Observable<any> {
    return this.log({
      action: AuditAction.VIEW_SENSITIVE,
      entityType,
      entityId,
      details: `Accès aux données sensibles "${dataType}" pour ${entityType} #${entityId}`,
      metadata: {
        dataType
      }
    });
  }

  /**
   * Journaliser une exportation de données
   */
  logDataExport(
    dataType: string, 
    filters?: Record<string, any>
  ): Observable<any> {
    return this.log({
      action: AuditAction.EXPORT,
      entityType: AuditEntityType.SYSTEM,
      details: `Exportation des données "${dataType}"`,
      metadata: {
        dataType,
        filters
      }
    });
  }
}