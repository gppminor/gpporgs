import { Component, inject } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AdminService } from 'src/app/services/admin.service';
import { Action } from 'src/app/types/enums';
import { Role, User } from 'src/app/types/user';

@Component({
  selector: 'app-admin-action',
  templateUrl: './admin-action.component.html',
  styleUrl: './admin-action.component.scss',
})
export class AdminActionComponent {
  private fb = inject(FormBuilder);
  private snackbar = inject(MatSnackBar);
  private adminService = inject(AdminService);
  private dialogRef = inject(MatDialogRef<AdminActionComponent>);
  private data: any = inject(MAT_DIALOG_DATA);

  Role = Role;
  Action = Action;
  action = Action.ADD;
  user?: User;

  titles = new Map([
    [Action.ADD, 'Add User'],
    [Action.EDIT, 'Edit User'],
    [Action.DELETE, 'Delete User'],
  ]);

  readonly domain = '@berkeley.edu';
  loading = false;

  username = this.fb.control<string | null>(null, Validators.required);
  role = this.fb.control<Role>(Role.STUDENT, Validators.required);

  constructor() {
    this.action = this.data?.action;
    this.user = this.data?.user;
    if (this.user) {
      this.username.setValue(this.user.email.split('@')[0]);
      this.role.setValue(this.user.role);
    }
  }

  onRole(event: any) {
    console.log(event);
  }

  async addUser() {
    this.loading = true;
    const email = `${this.username.value}${this.domain}`;
    const result = await this.adminService.addUser(email, this.role.value);
    this.snackbar.open(result);
    this.loading = false;
    this.dialogRef.close();
  }

  async updateUser() {
    const id = this.user?.id;
    const email = `${this.username.value}${this.domain}`
    const role = this.role.value;
    if (!id || !email || !role) return;
    this.loading = true;
    const result = await this.adminService.updateUser(id, email, role);
    this.snackbar.open(result);
    this.loading = false;
    this.dialogRef.close();
  }

  async deleteUser() {
    const id = this.user?.id;
    if (!id) return;
    this.loading = true;
    const result = await this.adminService.deleteUser(id);
    this.snackbar.open(result);
    this.loading = false;
    this.dialogRef.close();
  }
}
