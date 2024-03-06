import { Component, OnDestroy, inject } from '@angular/core';
import {
  Auth,
  Unsubscribe,
  onAuthStateChanged,
  signOut,
} from '@angular/fire/auth';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { Role } from 'src/app/models/user';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent implements OnDestroy {
  private auth = inject(Auth);
  private router = inject(Router);

  Role = Role;
  user = new Subject<any>();
  role = new Subject<Role>();

  private unsubscribe: Unsubscribe;

  constructor() {
    this.unsubscribe = onAuthStateChanged(this.auth, (_user) => {
      if (_user) {
        this.user.next(_user);
        _user.getIdTokenResult(true).then((token) => {
          if (token.claims['admin']) {
            this.role.next(Role.ADMIN);
          }
        });
      } else {
        this.user.next(null);
        this.role.next(Role.NONE);
      }
    });
  }

  ngOnDestroy(): void {
    this.unsubscribe();
  }

  adminView() {
    this.router.navigate(['admin']);
  }

  async logout() {
    await signOut(this.auth);
    this.router.navigate(['']);
  }
}
