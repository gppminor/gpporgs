import { Injectable, OnDestroy, inject } from '@angular/core';
import {
  Auth,
  onAuthStateChanged,
  signInWithRedirect,
  signOut,
  user,
} from '@angular/fire/auth';
import { Unsubscribe } from '@angular/fire/firestore';
import { Functions, httpsCallable } from '@angular/fire/functions';
import { Router } from '@angular/router';
import { GoogleAuthProvider, User } from 'firebase/auth';
import { BehaviorSubject, Subject } from 'rxjs';
import { CLOUD_FNS } from 'src/app/constants';
import { Role } from 'src/app/types/user';

@Injectable({
  providedIn: 'root',
})
export class AuthService implements OnDestroy {
  private auth = inject(Auth);
  private router = inject(Router);
  private functions = inject(Functions);
  private provider = new GoogleAuthProvider();

  setClaims = httpsCallable(this.functions, CLOUD_FNS.SET_CLAIMS);
  delUser = httpsCallable(this.functions, CLOUD_FNS.DEL_USER);

  user$ = user(this.auth);
  private uid: string | null = null;
  private role = new Subject<Role>();
  role$ = this.role.asObservable();

  private loading = new BehaviorSubject<boolean>(false);
  loading$ = this.loading.asObservable();

  private unsubscribe: Unsubscribe;

  constructor() {
    this.loading.next(true);
    this.unsubscribe = onAuthStateChanged(this.auth, (user: User | null) =>
      this.onAuthChanged(user)
    );
  }

  ngOnDestroy(): void {
    this.unsubscribe();
  }

  async onAuthChanged(user: User | null) {
    this.uid = user?.uid || null;
    this.loading.next(true);
    if (!user) {
      this.uid = null;
      this.role.next(Role.NONE);
      this.loading.next(false);
      return;
    }
    let token = await user.getIdTokenResult(true);
    if (!token.claims['admin'] && !token.claims['student']) {
      // set and fetch claims for new user
      await this.setClaims({ uid: this.uid });
      token = await user.getIdTokenResult(true);
    }
    if (token.claims['admin']) this.role.next(Role.ADMIN);
    if (token.claims['student']) this.role.next(Role.STUDENT);

    this.loading.next(false);
    if (!token.claims['admin'] && !token.claims['student']) {
      // invalid claim, logout user
      await signOut(this.auth);
      this.router.navigateByUrl('/login');
    }
  }

  async signIn() {
    this.loading.next(true);
    setTimeout(() => signInWithRedirect(this.auth, this.provider), 700);
  }

  async deleteCurrentUser() {
    if (!this.uid) return;
    await this.delUser({ uid: this.uid });
  }
}
