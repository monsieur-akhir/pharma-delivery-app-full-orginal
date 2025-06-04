/**
 * Update schema relationships for permissions system
 */
import { relations } from 'drizzle-orm';
import { users, permissions, role_permissions, user_permissions } from './schema';

// Define relationships for users
export const usersRelations = relations(users, ({ many }) => ({
  userPermissions: many(user_permissions),
}));

// Define relationships for permissions
export const permissionsRelations = relations(permissions, ({ many }) => ({
  rolePermissions: many(role_permissions),
  userPermissions: many(user_permissions),
}));

// Define relationships for role_permissions
export const rolePermissionsRelations = relations(role_permissions, ({ one }) => ({
  permission: one(permissions, {
    fields: [role_permissions.permission_id],
    references: [permissions.id],
  }),
}));

// Define relationships for user_permissions
export const userPermissionsRelations = relations(user_permissions, ({ one }) => ({
  user: one(users, {
    fields: [user_permissions.user_id],
    references: [users.id],
  }),
  permission: one(permissions, {
    fields: [user_permissions.permission_id],
    references: [permissions.id],
  }),
}));
