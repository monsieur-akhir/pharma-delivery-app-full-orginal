import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { and, eq, inArray, or } from 'drizzle-orm';
import { permissions, role_permissions, user_permissions, users } from '../../../../shared/src/schema';

@Injectable()
export class PermissionsService {
  private readonly logger = new Logger(PermissionsService.name);

  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * Vérifie si un utilisateur possède une permission spécifique
   * @param userId ID de l'utilisateur
   * @param permissionName Nom de la permission à vérifier
   * @returns true si l'utilisateur a la permission, false sinon
   */
  async hasPermission(userId: number, permissionName: string): Promise<boolean> {
    try {
      const db = this.databaseService.db;

      // 1. Récupérer l'utilisateur pour connaître son rôle
      const userResults = await db
        .select({ role: users.role })
        .from(users)
        .where(eq(users.id, userId));

      if (userResults.length === 0) {
        throw new NotFoundException(`Utilisateur avec l'ID ${userId} non trouvé`);
      }

      const userRole = userResults[0].role;

      // Les SUPER_ADMIN ont toutes les permissions automatiquement
      if (userRole === 'SUPER_ADMIN') {
        return true;
      }

      // 2. Récupérer l'ID de la permission demandée
      const permResults = await db
        .select({ id: permissions.id })
        .from(permissions)
        .where(eq(permissions.name, permissionName));

      if (permResults.length === 0) {
        this.logger.warn(`Permission "${permissionName}" non trouvée dans la base de données`);
        return false;
      }

      const permissionId = permResults[0].id;

      // 3. Vérifier si l'utilisateur a une dérogation spécifique
      const userPermResults = await db
        .select()
        .from(user_permissions)
        .where(
          and(
            eq(user_permissions.user_id, userId),
            eq(user_permissions.permission_id, permissionId)
          )
        );

      // Si l'utilisateur a une dérogation explicite, elle prend le dessus
      if (userPermResults.length > 0) {
        return userPermResults[0].granted;
      }

      // 4. Vérifier les permissions basées sur le rôle
      const rolePermResults = await db
        .select()
        .from(role_permissions)
        .where(
          and(
            eq(role_permissions.role, userRole),
            eq(role_permissions.permission_id, permissionId)
          )
        );

      return rolePermResults.length > 0;
    } catch (error) {
      this.logger.error(
        `Erreur lors de la vérification de la permission "${permissionName}" pour l'utilisateur ${userId}: ${error.message}`,
        error.stack
      );
      return false;
    }
  }

  /**
   * Récupère toutes les permissions dans le système
   */
  async getAllPermissions() {
    try {
      const db = this.databaseService.db;
      
      const results = await db
        .select()
        .from(permissions)
        .orderBy(permissions.category, permissions.name);
      
      return results;
    } catch (error) {
      this.logger.error(`Erreur lors de la récupération des permissions: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Récupère les permissions par rôle
   */
  async getPermissionsByRole(role: string) {
    try {
      const db = this.databaseService.db;
        const results = await db
        .select({
          id: permissions.id,
          name: permissions.name,
          description: permissions.description,
          category: permissions.category
        })
        .from(role_permissions)
        .innerJoin(permissions, eq(role_permissions.permission_id, permissions.id))
        .where(eq(role_permissions.role, role as any))
        .orderBy(permissions.category, permissions.name);
      
      return results;
    } catch (error) {
      this.logger.error(
        `Erreur lors de la récupération des permissions pour le rôle ${role}: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  /**
   * Récupère les permissions d'un utilisateur (combinaison rôle + dérogations)
   */
  async getUserPermissions(userId: number) {
    try {
      const db = this.databaseService.db;
      
      // 1. Récupérer l'utilisateur pour connaître son rôle
      const userResults = await db
        .select({ role: users.role })
        .from(users)
        .where(eq(users.id, userId));

      if (userResults.length === 0) {
        throw new NotFoundException(`Utilisateur avec l'ID ${userId} non trouvé`);
      }

      const userRole = userResults[0].role;

      // 2. Si SUPER_ADMIN, retourner toutes les permissions
      if (userRole === 'SUPER_ADMIN') {
        return await this.getAllPermissions();
      }

      // 3. Récupérer les permissions de rôle
      const rolePermissions = await this.getPermissionsByRole(userRole);
      
      // 4. Récupérer les dérogations spécifiques à l'utilisateur
      const userOverrides = await db
        .select({
          id: permissions.id,
          name: permissions.name,
          description: permissions.description,
          category: permissions.category,
          granted: user_permissions.granted
        })
        .from(user_permissions)
        .innerJoin(permissions, eq(user_permissions.permission_id, permissions.id))
        .where(eq(user_permissions.user_id, userId));
      
      // 5. Combiner les deux ensembles
      const permMap = new Map();
      
      // D'abord les permissions de rôle
      rolePermissions.forEach(perm => {
        permMap.set(perm.name, { 
          ...perm, 
          source: 'role',
          granted: true
        });
      });
      
      // Ensuite les dérogations utilisateur qui peuvent remplacer
      userOverrides.forEach(perm => {
        permMap.set(perm.name, { 
          ...perm, 
          source: 'user',
          granted: perm.granted
        });
      });
      
      return Array.from(permMap.values());
    } catch (error) {
      this.logger.error(
        `Erreur lors de la récupération des permissions pour l'utilisateur ${userId}: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  /**
   * Mettre à jour les permissions d'un rôle
   */
  async updateRolePermissions(role: string, permissionIds: number[], adminUserId: number) {
    try {
      // Vérifier que l'administrateur a le droit de modifier les permissions
      const canManagePermissions = await this.hasPermission(adminUserId, 'system:permissions');
      if (!canManagePermissions) {
        throw new ForbiddenException("Vous n'avez pas l'autorisation de gérer les permissions");
      }
      
      const db = this.databaseService.db;
        // Supprimer les permissions existantes
      await db.delete(role_permissions).where(eq(role_permissions.role, role as any));
      
      // Ajouter les nouvelles permissions
      for (const permId of permissionIds) {
        await db.insert(role_permissions).values({
          role: role as any,
          permission_id: permId,
          created_at: new Date()
        });
      }
      
      return { 
        success: true, 
        message: `Permissions mises à jour pour le rôle ${role}`,
        count: permissionIds.length
      };
    } catch (error) {
      this.logger.error(
        `Erreur lors de la mise à jour des permissions pour le rôle ${role}: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  /**
   * Définir une dérogation de permission pour un utilisateur
   */
  async setUserPermission(userId: number, permissionId: number, granted: boolean, adminUserId: number) {
    try {
      // Vérifier que l'administrateur a le droit de modifier les permissions
      const canManagePermissions = await this.hasPermission(adminUserId, 'system:permissions');
      if (!canManagePermissions) {
        throw new ForbiddenException("Vous n'avez pas l'autorisation de gérer les permissions");
      }
      
      const db = this.databaseService.db;
      
      // Vérifier si la dérogation existe déjà
      const existingOverride = await db
        .select()
        .from(user_permissions)
        .where(
          and(
            eq(user_permissions.user_id, userId),
            eq(user_permissions.permission_id, permissionId)
          )
        );
      
      if (existingOverride.length > 0) {
        // Mettre à jour la dérogation existante
        await db
          .update(user_permissions)
          .set({ 
            granted, 
            updated_at: new Date() 
          })
          .where(
            and(
              eq(user_permissions.user_id, userId),
              eq(user_permissions.permission_id, permissionId)
            )
          );
      } else {
        // Créer une nouvelle dérogation
        await db.insert(user_permissions).values({
          user_id: userId,
          permission_id: permissionId,
          granted,
          created_at: new Date(),
          updated_at: new Date()
        });
      }
      
      return { 
        success: true, 
        message: `Permission ${granted ? 'accordée' : 'refusée'} pour l'utilisateur ${userId}`,
        granted
      };
    } catch (error) {
      this.logger.error(
        `Erreur lors de la configuration de la permission ${permissionId} pour l'utilisateur ${userId}: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  /**
   * Supprimer une dérogation de permission pour un utilisateur
   */
  async removeUserPermission(userId: number, permissionId: number, adminUserId: number) {
    try {
      // Vérifier que l'administrateur a le droit de modifier les permissions
      const canManagePermissions = await this.hasPermission(adminUserId, 'system:permissions');
      if (!canManagePermissions) {
        throw new ForbiddenException("Vous n'avez pas l'autorisation de gérer les permissions");
      }
      
      const db = this.databaseService.db;
      
      // Supprimer la dérogation
      await db
        .delete(user_permissions)
        .where(
          and(
            eq(user_permissions.user_id, userId),
            eq(user_permissions.permission_id, permissionId)
          )
        );
      
      return { 
        success: true, 
        message: `Dérogation de permission supprimée pour l'utilisateur ${userId}`
      };
    } catch (error) {
      this.logger.error(
        `Erreur lors de la suppression de la dérogation ${permissionId} pour l'utilisateur ${userId}: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }
}
