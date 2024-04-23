import { Component, inject } from '@angular/core';
import { Auth } from '@angular/fire/auth';
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
  loading = false;

  async confirmDelete() {
    await this.authService.deleteCurrentUser();
    this.router.navigateByUrl('/login');
  }
}
