import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit {
  private router = inject(Router);
  private authService = inject(AuthService);

  isLoading = true;
  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.authService.user$.pipe(takeUntil(this.destroy$)).subscribe((user) => {
      if (user) {
        this.router.navigate(['dashboard']);
      }
      this.isLoading = false;
    });
  }

  login() {
    this.isLoading = true;
    setTimeout(() => this.authService.signIn(), 700);
  }
}
