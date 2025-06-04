import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from './jwt-auth.guard';
import { PermissionsService } from '../../admin/permissions/permissions.service';

@Injectable()
export class PermissionsGuard extends JwtAuthGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private permissionsService: PermissionsService
  ) {
    super();
  }

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
    
    // Check if user has ANY of the required permissions
    for (const permission of requiredPermissions) {
      const hasPermission = await this.permissionsService.hasPermission(user.id, permission);
      if (hasPermission) {
        return true;
      }
    }
    
    return false;
  }
}
