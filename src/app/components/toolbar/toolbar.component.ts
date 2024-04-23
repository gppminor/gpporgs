import { Component, OnDestroy, inject } from '@angular/core';
import { Auth, signOut } from '@angular/fire/auth';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from 'src/app/services/auth.service';
import { Role } from 'src/app/types/user';
import { ConfirmDeleteComponent } from '../confirm-delete/confirm-delete.component';

@Component({
  selector: 'app-toolbar',
  templateUrl: './toolbar.component.html',
  styleUrls: ['./toolbar.component.scss'],
})
export class ToolbarComponent implements OnDestroy {
  private auth = inject(Auth);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  authService = inject(AuthService);

  Role = Role;
  loading = true;
  private destroy$ = new Subject<void>();

  constructor() {
    this.authService.loading$
      .pipe(takeUntil(this.destroy$))
      .subscribe((value) => (this.loading = value));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  adminView(route: string) {
    this.router.navigate([route]);
  }

  signIn() {
    this.authService.signIn();
  }

  async signOut() {
    await signOut(this.auth);
    this.router.navigateByUrl('/login');
  }

  async deleteAccount() {
    this.dialog.open(ConfirmDeleteComponent, { disableClose: true });
  }
}
