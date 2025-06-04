import { Directive, Input, OnInit, TemplateRef, ViewContainerRef, OnDestroy } from '@angular/core';
import { RbacService } from './rbac.service';
import { Action, Permission, Resource } from './rbac.model';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

/**
 * Directive qui masque ou affiche un élément en fonction des permissions de l'utilisateur
 * 
 * Usage: 
 * <button *appHasPermission="{ resource: Resource.USERS, action: Action.CREATE }">Créer utilisateur</button>
 * <div *appHasPermission="[{ resource: Resource.DASHBOARD, action: Action.VIEW }, { resource: Resource.USERS, action: Action.VIEW }]; strategy: 'any'">Contenu</div>
 * <button *appHasPermission="{ resource: Resource.AUDIT_LOGS, action: Action.EXPORT }; else noPermission">Exporter logs</button>
 * <ng-template #noPermission><button disabled>Exporter logs (non autorisé)</button></ng-template>
 */
@Directive({
  selector: '[appHasPermission]'
})
export class HasPermissionDirective implements OnInit, OnDestroy {
  private permissions: Permission | Permission[] = [];
  private strategy: 'all' | 'any' = 'all';
  private hasView = false;
  private destroy$ = new Subject<void>();

  constructor(
    private templateRef: TemplateRef<any>,
    private viewContainer: ViewContainerRef,
    private rbacService: RbacService
  ) {}

  @Input() set appHasPermission(value: Permission | Permission[]) {
    this.permissions = value;
    this.updateView();
  }

  @Input() set appHasPermissionStrategy(strategy: 'all' | 'any') {
    this.strategy = strategy;
    this.updateView();
  }

  ngOnInit() {
    this.updateView();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private updateView() {
    let hasPermission = false;

    if (Array.isArray(this.permissions)) {
      if (this.strategy === 'any') {
        hasPermission = this.rbacService.hasAnyPermission(this.permissions);
      } else {
        hasPermission = this.rbacService.hasAllPermissions(this.permissions);
      }
    } else if (this.permissions && 'resource' in this.permissions && 'action' in this.permissions) {
      hasPermission = this.rbacService.hasPermission(
        this.permissions.resource, 
        this.permissions.action
      );
    }

    if (hasPermission && !this.hasView) {
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.hasView = true;
    } else if (!hasPermission && this.hasView) {
      this.viewContainer.clear();
      this.hasView = false;
    }
  }
}

/**
 * Directive qui désactive un élément en fonction des permissions de l'utilisateur
 * 
 * Usage:
 * <button [appDisableIfNoPermission]="{ resource: Resource.USERS, action: Action.CREATE }">Créer utilisateur</button>
 * <button [appDisableIfNoPermission]="[{ resource: Resource.DASHBOARD, action: Action.EXPORT }, { resource: Resource.ORDERS, action: Action.UPDATE }]" 
 *         [appDisableIfNoPermissionStrategy]="'any'">Action</button>
 */
@Directive({
  selector: '[appDisableIfNoPermission]'
})
export class DisableIfNoPermissionDirective implements OnInit, OnDestroy {
  private permissions: Permission | Permission[] = [];
  private strategy: 'all' | 'any' = 'all';
  private destroy$ = new Subject<void>();
  private element: HTMLElement;

  constructor(
    private viewContainerRef: ViewContainerRef,
    private rbacService: RbacService
  ) {
    this.element = this.viewContainerRef.element.nativeElement;
  }

  @Input() set appDisableIfNoPermission(value: Permission | Permission[]) {
    this.permissions = value;
    this.updateDisabledState();
  }

  @Input() set appDisableIfNoPermissionStrategy(strategy: 'all' | 'any') {
    this.strategy = strategy;
    this.updateDisabledState();
  }

  ngOnInit() {
    this.updateDisabledState();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private updateDisabledState() {
    let hasPermission = false;

    if (Array.isArray(this.permissions)) {
      if (this.strategy === 'any') {
        hasPermission = this.rbacService.hasAnyPermission(this.permissions);
      } else {
        hasPermission = this.rbacService.hasAllPermissions(this.permissions);
      }
    } else if (this.permissions && 'resource' in this.permissions && 'action' in this.permissions) {
      hasPermission = this.rbacService.hasPermission(
        this.permissions.resource, 
        this.permissions.action
      );
    }

    if (!hasPermission) {
      this.element.setAttribute('disabled', 'true');
      // Ajout d'une classe pour du styling additionnel possible
      this.element.classList.add('permission-disabled');
    } else {
      this.element.removeAttribute('disabled');
      this.element.classList.remove('permission-disabled');
    }
  }
}