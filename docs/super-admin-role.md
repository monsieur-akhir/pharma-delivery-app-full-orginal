# SUPER_ADMIN Role Implementation Documentation

## Overview

The SUPER_ADMIN role is designed to have unrestricted access to all features and functions in the Pharmaceutical Delivery App. This document explains how the SUPER_ADMIN role is implemented across the application, what permissions it has, and how to verify its functionality.

## Role Characteristics

The SUPER_ADMIN role:
- Has access to all permissions without explicit assignment
- Can access all routes without restriction
- Can manage other users, including their roles and permissions
- Has the highest level of authority in the system

## Implementation Details

### Backend Implementation

#### Database Schema

In the shared schema definition (`shared/src/schema.ts`), the SUPER_ADMIN role is defined in the `userRoleEnum`:

```typescript
export const userRoleEnum = pgEnum("user_role", [
  "CUSTOMER",
  "ADMIN",
  "PHARMACY_STAFF",
  "PHARMACIST",
  "DELIVERY_PERSON",
  "SUPER_ADMIN",
]);
```

#### Permissions Guard

In the NestJS backend, the `PermissionsGuard` (`backend/src/auth/guards/permissions.guard.ts`) automatically grants access to all endpoints for users with the SUPER_ADMIN role:

```typescript
async canActivate(context: ExecutionContext): Promise<boolean> {
  // First check if user is authenticated
  const isAuthenticated = await super.canActivate(context);
  if (!isAuthenticated) {
    return false;
  }

  // Get required permissions from metadata
  const requiredPermissions = this.reflector.get<string[]>('permissions', context.getHandler());
  if (!requiredPermissions || requiredPermissions.length === 0) {
    return true; // No permissions required, proceed
  }

  const { user } = context.switchToHttp().getRequest();
  
  // Super admin can do everything
  if (user.role === 'SUPER_ADMIN') {
    return true;
  }
  
  // Check permissions for other roles...
}
```

#### Permissions Service

The `PermissionsService` (`backend/src/admin/permissions/permissions.service.ts`) also implements special handling for SUPER_ADMIN users:

```typescript
async hasPermission(userId: number, permissionName: string): Promise<boolean> {
  // Get user role
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
  
  // Check permissions for other roles...
}
```

### Frontend Implementation

#### RBAC Service

In the Angular admin portal, the `RbacService` (`admin-portal/src/app/core/auth/rbac.service.ts`) automatically grants all permissions to SUPER_ADMIN users:

```typescript
public hasPermission(resource: Resource, action: Action): boolean {
  if (!this.currentUserRole) {
    return false;
  }
  
  // Les super admins et admins ont automatiquement toutes les permissions
  if (this.currentUserRole === Role.SUPER_ADMIN || this.currentUserRole === Role.ADMIN) {
    return true;
  }
  
  // Check permissions for other roles...
}
```

Similar implementations exist for `hasAnyPermission()`, `hasAllPermissions()`, and `canAccessRoute()`.

#### Auth Guard

The `AuthGuard` (`admin-portal/src/app/core/guards/auth.guard.ts`) also includes special handling for SUPER_ADMIN:

```typescript
private checkUserRole(requiredRole: string | string[]): boolean {
  const user = this.authService.currentUserValue;
  if (!user) return false;
  
  // SUPER_ADMIN can access everything
  if (user.role === 'SUPER_ADMIN') {
    return true;
  }
  
  // Handle role checks for other roles...
}
```

#### RBAC Model

The `rbac.model.ts` file defines the SUPER_ADMIN role and its permissions:

```typescript
export const rolePermissions: Record<Role, Permission[]> = {
  [Role.SUPER_ADMIN]: [
    // Super Admin a toutes les permissions
    ...Object.values(Resource).flatMap(resource => 
      Object.values(Action).map(action => ({
        resource,
        action
      }))
    )
  ],
  // Other roles...
};
```

## Creating a SUPER_ADMIN User

A SUPER_ADMIN user can be created using the `create-super-admin.js` script in the `scripts` folder. This script:

1. Checks if a super admin user already exists
2. Creates a new super admin user with default credentials if none exists
3. Outputs the login credentials for the created user

Example:
```bash
node scripts/create-super-admin.js
```

## Testing SUPER_ADMIN Permissions

You can verify that the SUPER_ADMIN role has access to all permissions using the `test-super-admin-permissions.js` script:

```bash
node scripts/test-super-admin-permissions.js
```

This script:
1. Finds a SUPER_ADMIN user in the database
2. Retrieves all permissions defined in the system
3. Tests if the SUPER_ADMIN user has each permission
4. Provides a report on permission coverage

## Best Practices

1. **Limited Distribution**: The SUPER_ADMIN role should be assigned to a limited number of trusted users.

2. **Audit Logging**: All actions performed by SUPER_ADMIN users should be thoroughly logged for security audits.

3. **Strong Authentication**: SUPER_ADMIN accounts should use strong authentication methods, including 2FA/OTP.

4. **Regular Review**: Regularly review the list of users with SUPER_ADMIN role.

5. **Emergency Access**: Have a procedure for emergency access to SUPER_ADMIN functionality.

## Troubleshooting

1. **Permission Issues**: If a SUPER_ADMIN user is denied access to a feature, check:
   - User's role assignment in the database
   - The guard implementation for that specific route
   - Any custom middleware that might override permission checks

2. **Frontend Access Issues**: If a SUPER_ADMIN user can't access a component in the admin portal, check:
   - The route permissions in the RBAC model
   - Any custom structural directives that might be controlling visibility
   - The auth guard implementation for that route

## Conclusion

The SUPER_ADMIN role implementation ensures that designated administrators have unrestricted access to the entire system. This is achieved through special handling in the permission guards, services, and RBAC system rather than explicit permission assignments.
