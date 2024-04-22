import { Component, inject } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AdminService } from 'src/app/services/admin.service';
import { Action } from 'src/app/types/enums';
import { Role, User } from 'src/app/types/user';

@Component({
  selector: 'app-action-user',
  templateUrl: './action-user.component.html',
  styleUrl: './action-user.component.scss',
})
export class ActionUserComponent {
  private fb = inject(FormBuilder);
  private snackbar = inject(MatSnackBar);
  private adminService = inject(AdminService);
  private dialogRef = inject(MatDialogRef<ActionUserComponent>);
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
    const role = this.role.value;
    const email = `${this.username.value}${this.domain}`;
    if (!role || !email) return;
    const userInfo: User = {
      email,
      role,
      createdAt: Date.now(),
      lastAccessAt: 0,
      loginCount: 0,
      name: '',
    };
    const result = await this.adminService.addUser(userInfo);
    if (result && result.id) {
      this.snackbar.open('User successfully added');
      userInfo.id = result.id;
      this.dialogRef.close(userInfo);
    } else {
      this.snackbar.open('Error adding user');
    }
    this.loading = false;
  }

  async updateUser() {
    const id = this.user?.id;
    const email = `${this.username.value}${this.domain}`;
    const role = this.role.value;
    if (!id || !email || !role) return;
    this.loading = true;
    const partial = { email, role };
    await this.adminService.updateUser(id, partial);
    this.snackbar.open('User successfully updated');
    this.loading = false;
    this.dialogRef.close({ id, ...partial });
  }

  async deleteUser() {
    const id = this.user?.id;
    if (!id) return;
    this.loading = true;
    await this.adminService.deleteUser(id);
    this.snackbar.open('User deleted successfully');
    this.loading = false;
    this.dialogRef.close(id);
  }
}
