import { Component, inject } from '@angular/core';
import { Auth, signOut } from '@angular/fire/auth';
import { Router } from '@angular/router';
import { Role } from 'src/app/models/user';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent {
  private auth = inject(Auth);
  private router = inject(Router);
  authService = inject(AuthService);

  Role = Role;

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
