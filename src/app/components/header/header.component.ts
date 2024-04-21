import { Component, OnDestroy, inject } from '@angular/core';
import { Auth, signOut } from '@angular/fire/auth';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from 'src/app/services/auth.service';
import { Role } from 'src/app/types/user';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent implements OnDestroy {
  private auth = inject(Auth);
  private router = inject(Router);
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
    this.router.navigate(['']);
  }

  async deleteAccount() {}
}
