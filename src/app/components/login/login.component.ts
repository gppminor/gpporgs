import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import {
  Auth,
  GoogleAuthProvider,
  Unsubscribe,
  getRedirectResult,
  onAuthStateChanged,
  signInWithRedirect,
  user,
} from '@angular/fire/auth';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { Role } from 'src/app/models/user';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnDestroy {
  private auth = inject(Auth);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private authService = inject(AuthService);
  private provider = new GoogleAuthProvider();

  user$ = user(this.auth);
  isLoading = true;

  private unsubscribe: Unsubscribe;

  constructor() {
    this.unsubscribe = onAuthStateChanged(this.auth, async (_user) => {
      if (_user) {
        this.authService.updateLastAccess(_user.email);
        this.router.navigate(['dashboard']);
      }
      this.isLoading = false;
    });

    // This will be called automatically by browser after user completed authentication
    // Known issues: Isn't supported by Safari & Firefox browsers
    getRedirectResult(this.auth)
      .then((result) => this.authService.updateUser(result))
      .catch((error) => this.handleError(error));
  }

  ngOnDestroy(): void {
    this.unsubscribe();
  }

  login() {
    this.isLoading = true;
    setTimeout(() => signInWithRedirect(this.auth, this.provider), 700);
  }

  private handleError(error: any) {
    let message = 'An error occurred';
    if (error.message && error.message.includes('INVALID_ARGUMENT')) {
      message = 'Invalid email argument';
    } else if (error.message && error.message.includes('PERMISSION_DENIED')) {
      message = 'Use your berkeley.edu account';
    } else if (error.message && error.message.includes('NOT_FOUND')) {
      message = "You don't have access to GPP Organizations";
    }
    this.snackBar.open(message);
  }
}
