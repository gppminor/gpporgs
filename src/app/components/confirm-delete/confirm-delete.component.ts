import { Component, inject } from '@angular/core';
import { Auth, signOut } from '@angular/fire/auth';
import { MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-confirm-delete',
  templateUrl: './confirm-delete.component.html',
  styleUrl: './confirm-delete.component.scss',
})
export class ConfirmDeleteComponent {
  private authService = inject(AuthService);
  private auth = inject(Auth);
  private router = inject(Router);
  private dialogRef = inject(MatDialogRef<ConfirmDeleteComponent>);
  loading = false;

  async confirmDelete() {
    this.loading = true;
    await this.authService.deleteCurrentUser();
    await signOut(this.auth);
    this.router.navigateByUrl('/login');
    this.dialogRef.close();
    this.loading = false;
  }
}
