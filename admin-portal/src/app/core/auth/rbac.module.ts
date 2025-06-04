import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HasPermissionDirective, DisableIfNoPermissionDirective } from './has-permission.directive';
import { RbacService } from './rbac.service';
import { RbacGuard } from './rbac.guard';

@NgModule({
  declarations: [
    HasPermissionDirective,
    DisableIfNoPermissionDirective
  ],
  imports: [
    CommonModule
  ],
  exports: [
    HasPermissionDirective,
    DisableIfNoPermissionDirective
  ],
  providers: [
    RbacService,
    RbacGuard
  ]
})
export class RbacModule { }