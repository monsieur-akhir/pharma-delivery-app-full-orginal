import { Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FormBuilder, FormGroup } from '@angular/forms';
import { debounceTime } from 'rxjs/operators';
import { AuditLogsService, AuditLog, AuditLogFilter } from './audit-logs.service';

@Component({
  selector: 'app-audit-logs',
  templateUrl: './audit-logs.component.html',
  styleUrls: ['./audit-logs.component.scss']
})
export class AuditLogsComponent implements OnInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  // Table data
  dataSource = new MatTableDataSource<AuditLog>([]);
  displayedColumns: string[] = ['timestamp', 'username', 'action', 'entityType', 'entityId', 'details', 'ipAddress'];
  totalLogs = 0;
  pageSize = 10;
  pageSizeOptions = [5, 10, 25, 50, 100];
  currentPage = 0;
  
  // Filter form
  filterForm: FormGroup;
  filterOpen = false;
  
  // Filter options
  actionTypes: string[] = [];
  entityTypes: string[] = [];
  
  isLoading = true;
  error: string | null = null;

  constructor(
    private auditLogsService: AuditLogsService,
    private dialog: MatDialog,
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
    this.loadActionTypes();
    this.loadEntityTypes();
    this.loadAuditLogs();
    
    // Apply filters after a short delay when the form changes
    this.filterForm.valueChanges
      .pipe(debounceTime(500))
      .subscribe(() => {
        this.currentPage = 0;
        this.loadAuditLogs();
      });
  }

  loadAuditLogs(): void {
    this.isLoading = true;
    
    const filters: AuditLogFilter = this.buildFilters();
    
    this.auditLogsService.getAuditLogs(this.currentPage + 1, this.pageSize, filters)
      .subscribe(
        response => {
          this.dataSource.data = response.data;
          this.totalLogs = response.total;
          this.isLoading = false;
        },
        error => {
          console.error('Error loading audit logs', error);
          this.error = 'Impossible de charger les logs d\'audit. Veuillez réessayer.';
          this.isLoading = false;
        }
      );
  }

  loadActionTypes(): void {
    this.auditLogsService.getActionTypes()
      .subscribe(
        types => this.actionTypes = types,
        error => console.error('Error loading action types', error)
      );
  }

  loadEntityTypes(): void {
    this.auditLogsService.getEntityTypes()
      .subscribe(
        types => this.entityTypes = types,
        error => console.error('Error loading entity types', error)
      );
  }

  onPageChange(event: any): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadAuditLogs();
  }

  toggleFilters(): void {
    this.filterOpen = !this.filterOpen;
  }

  resetFilters(): void {
    this.filterForm.reset();
    this.currentPage = 0;
    this.loadAuditLogs();
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
    
    this.auditLogsService.exportAuditLogsCSV(filters)
      .subscribe(
        blob => {
          const today = new Date().toISOString().slice(0, 10);
          const fileName = `pharmacy-admin_audit-logs_${today}.csv`;
          
          // Create a download link
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = fileName;
          document.body.appendChild(a);
          a.click();
          
          // Cleanup
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
          
          this.snackBar.open(`Logs d'audit exportés avec succès: ${fileName}`, 'Fermer', {
            duration: 3000
          });
        },
        error => {
          console.error('Error exporting audit logs', error);
          this.snackBar.open(`Impossible d'exporter les logs d'audit. Veuillez réessayer.`, 'Fermer', {
            duration: 3000
          });
        }
      );
  }

  getActionClass(action: string): string {
    action = action.toLowerCase();
    if (action === 'create') return 'action-create';
    if (action === 'update') return 'action-update';
    if (action === 'delete') return 'action-delete';
    if (action === 'login') return 'action-login';
    if (action === 'logout') return 'action-logout';
    if (action === 'approve') return 'action-approve';
    if (action === 'reject') return 'action-reject';
    return '';
  }
}