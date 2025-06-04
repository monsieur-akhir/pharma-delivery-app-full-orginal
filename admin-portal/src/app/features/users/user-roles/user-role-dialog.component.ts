import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UserRole } from '../../../core/models/user.model';

export interface UserRoleDialogData {
  userId: number;
  username: string;
  currentRole: UserRole;
}

@Component({
  selector: 'app-user-role-dialog',
  templateUrl: './user-role-dialog.component.html',
  styleUrls: ['./user-role-dialog.component.scss']
})
export class UserRoleDialogComponent {
  roleForm: FormGroup;
  roles = Object.values(UserRole);
  
  constructor(
    public dialogRef: MatDialogRef<UserRoleDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: UserRoleDialogData,
    private fb: FormBuilder
  ) {
    this.roleForm = this.fb.group({
      role: [data.currentRole, Validators.required]
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSubmit(): void {
    if (this.roleForm.valid) {
      this.dialogRef.close(this.roleForm.value.role);
    }
  }
}