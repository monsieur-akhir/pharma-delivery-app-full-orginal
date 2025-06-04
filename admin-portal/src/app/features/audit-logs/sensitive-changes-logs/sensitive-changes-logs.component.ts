import { Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FormBuilder, FormGroup } from '@angular/forms';
import { debounceTime } from 'rxjs/operators';
import { AuditLogsService, AuditLog, AuditLogFilter } from '../audit-logs.service';
import { AuditAction, AuditEntityType } from '../../../core/services/audit-logger.service';

@Component({
  selector: 'app-sensitive-changes-logs',
  templateUrl: './sensitive-changes-logs.component.html',
  styleUrls: ['./sensitive-changes-logs.component.scss']
})
export class SensitiveChangesLogsComponent implements OnInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  // Tableau de données
  dataSource = new MatTableDataSource<AuditLog>([]);
  displayedColumns: string[] = ['timestamp', 'username', 'action', 'entityType', 'entityId', 'details', 'ipAddress'];
  totalLogs = 0;
  pageSize = 10;
  pageSizeOptions = [5, 10, 25, 50, 100];
  currentPage = 0;
  
  // Formulaire de filtres
  filterForm: FormGroup;
  filterOpen = false;
  
  // Options de filtres
  actionTypes: string[] = Object.values(AuditAction).filter(action => 
    // Limiter aux actions sensibles
    [
      AuditAction.APPROVE, 
      AuditAction.REJECT, 
      AuditAction.VIEW_SENSITIVE, 
      AuditAction.RESET,
      AuditAction.EXPORT
    ].includes(action as AuditAction)
  );
  entityTypes: string[] = Object.values(AuditEntityType);
  
  isLoading = true;
  error: string | null = null;

  constructor(
    private auditLogsService: AuditLogsService,
    private snackBar: MatSnackBar,
    private fb: FormBuilder
  ) {
    this.filterForm = this.fb.group({
      userId: [''],
      username: [''],
      action: [''],
      entityType: [''],
      entityId: [''],
      startDate: [''],
      endDate: ['']
    });
  }

  ngOnInit(): void {
    this.loadSensitiveChanges();
    
    // Appliquer les filtres après un court délai lorsque le formulaire change
    this.filterForm.valueChanges
      .pipe(debounceTime(500))
      .subscribe(() => {
        this.currentPage = 0;
        this.loadSensitiveChanges();
      });
  }

  loadSensitiveChanges(): void {
    this.isLoading = true;
    
    const filters: AuditLogFilter = this.buildFilters();
    
    // Limiter les résultats aux actions sensibles
    filters.action = this.actionTypes.join(',');
    
    this.auditLogsService.getAuditLogs(this.currentPage + 1, this.pageSize, filters)
      .subscribe(
        response => {
          this.dataSource.data = response.data;
          this.totalLogs = response.total;
          this.isLoading = false;
        },
        error => {
          console.error('Error loading sensitive changes logs', error);
          this.error = 'Impossible de charger les logs de modifications sensibles. Veuillez réessayer.';
          this.isLoading = false;
        }
      );
  }

  onPageChange(event: any): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadSensitiveChanges();
  }

  toggleFilters(): void {
    this.filterOpen = !this.filterOpen;
  }

  resetFilters(): void {
    this.filterForm.reset();
    this.currentPage = 0;
    this.loadSensitiveChanges();
  }

  buildFilters(): AuditLogFilter {
    const formValues = this.filterForm.value;
    const filters: AuditLogFilter = {};
    
    if (formValues.userId) filters.userId = parseInt(formValues.userId, 10);
    if (formValues.action) filters.action = formValues.action;
    if (formValues.entityType) filters.entityType = formValues.entityType;
    if (formValues.entityId) filters.entityId = parseInt(formValues.entityId, 10);
    if (formValues.startDate) filters.startDate = new Date(formValues.startDate).toISOString();
    if (formValues.endDate) filters.endDate = new Date(formValues.endDate).toISOString();
    
    return filters;
  }

  exportToCSV(): void {
    const filters: AuditLogFilter = this.buildFilters();
    filters.action = this.actionTypes.join(',');
    
    this.auditLogsService.exportAuditLogsCSV(filters)
      .subscribe(
        blob => {
          const today = new Date().toISOString().slice(0, 10);
          const fileName = `pharmacy-admin_sensitive-changes_${today}.csv`;
          
          // Créer un lien de téléchargement
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = fileName;
          document.body.appendChild(a);
          a.click();
          
          // Nettoyer
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
          
          this.snackBar.open(`Logs de modifications sensibles exportés avec succès: ${fileName}`, 'Fermer', {
            duration: 3000
          });
        },
        error => {
          console.error('Error exporting sensitive changes logs', error);
          this.snackBar.open(`Impossible d'exporter les logs de modifications sensibles. Veuillez réessayer.`, 'Fermer', {
            duration: 3000
          });
        }
      );
  }

  getActionClass(action: string): string {
    action = action.toLowerCase();
    if (action === 'approve') return 'action-approve';
    if (action === 'reject') return 'action-reject';
    if (action === 'view_sensitive') return 'action-view-sensitive';
    if (action === 'reset') return 'action-reset';
    if (action === 'export') return 'action-export';
    return '';
  }
}