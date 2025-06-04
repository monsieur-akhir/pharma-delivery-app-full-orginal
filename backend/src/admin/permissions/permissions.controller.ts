import { Controller, Get, Post, Body, Param, Delete, UseGuards, Req, Query } from '@nestjs/common';
import { PermissionsService } from './permissions.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiBody } from '@nestjs/swagger';

interface RequestWithUser {
  user: {
    id: number;
    role: string;
  };
}

@ApiTags('admin/permissions')
@Controller('api/admin/permissions')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Get()
  @ApiOperation({ summary: 'Récupérer toutes les permissions' })
  @Roles('SUPER_ADMIN', 'ADMIN')
  async getAllPermissions() {
    return this.permissionsService.getAllPermissions();
  }

  @Get('role/:role')
  @ApiOperation({ summary: 'Récupérer les permissions pour un rôle' })
  @ApiParam({ name: 'role', description: 'Le rôle à vérifier' })
  @Roles('SUPER_ADMIN', 'ADMIN')
  async getPermissionsByRole(@Param('role') role: string) {
    return this.permissionsService.getPermissionsByRole(role);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Récupérer les permissions pour un utilisateur' })
  @ApiParam({ name: 'userId', description: 'ID de l\'utilisateur' })
  @Roles('SUPER_ADMIN', 'ADMIN')
  async getUserPermissions(@Param('userId') userId: string) {
    return this.permissionsService.getUserPermissions(Number(userId));
  }

  @Post('role/:role')
  @ApiOperation({ summary: 'Mettre à jour les permissions pour un rôle' })
  @ApiParam({ name: 'role', description: 'Le rôle à modifier' })
  @ApiBody({ 
    schema: {
      type: 'object',
      properties: {
        permissionIds: {
          type: 'array',
          items: {
            type: 'number'
          },
          description: 'Liste des IDs de permission à attribuer'
        }
      }
    }
  })
  @Roles('SUPER_ADMIN')
  async updateRolePermissions(
    @Param('role') role: string, 
    @Body('permissionIds') permissionIds: number[],
    @Req() req: RequestWithUser
  ) {
    return this.permissionsService.updateRolePermissions(role, permissionIds, req.user.id);
  }

  @Post('user/:userId/permission/:permissionId')
  @ApiOperation({ summary: 'Définir une dérogation de permission pour un utilisateur' })
  @ApiParam({ name: 'userId', description: 'ID de l\'utilisateur' })
  @ApiParam({ name: 'permissionId', description: 'ID de la permission' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        granted: {
          type: 'boolean',
          description: 'Si la permission est accordée (true) ou refusée (false)'
        }
      }
    }
  })
  @Roles('SUPER_ADMIN')
  async setUserPermission(
    @Param('userId') userId: string,
    @Param('permissionId') permissionId: string,
    @Body('granted') granted: boolean,
    @Req() req: RequestWithUser
  ) {
    return this.permissionsService.setUserPermission(
      Number(userId), 
      Number(permissionId), 
      granted, 
      req.user.id
    );
  }

  @Delete('user/:userId/permission/:permissionId')
  @ApiOperation({ summary: 'Supprimer une dérogation de permission pour un utilisateur' })
  @ApiParam({ name: 'userId', description: 'ID de l\'utilisateur' })
  @ApiParam({ name: 'permissionId', description: 'ID de la permission' })
  @Roles('SUPER_ADMIN')
  async removeUserPermission(
    @Param('userId') userId: string,
    @Param('permissionId') permissionId: string,
    @Req() req: RequestWithUser
  ) {
    return this.permissionsService.removeUserPermission(
      Number(userId), 
      Number(permissionId), 
      req.user.id
    );
  }

  @Get('check/:permissionName')
  @ApiOperation({ summary: 'Vérifier si l\'utilisateur courant possède une permission spécifique' })
  @ApiParam({ name: 'permissionName', description: 'Nom de la permission à vérifier' })
  async checkUserPermission(
    @Param('permissionName') permissionName: string,
    @Req() req: RequestWithUser
  ) {
    const hasPermission = await this.permissionsService.hasPermission(req.user.id, permissionName);
    return { hasPermission };
  }
}
