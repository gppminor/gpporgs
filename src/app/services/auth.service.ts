import { Injectable, OnDestroy, inject } from '@angular/core';
import {
  Auth,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  user,
} from '@angular/fire/auth';
import {
  Firestore,
  Unsubscribe,
  doc,
  increment,
  updateDoc,
} from '@angular/fire/firestore';
import { Functions, httpsCallable } from '@angular/fire/functions';
import { Router } from '@angular/router';
import { GoogleAuthProvider, User } from 'firebase/auth';
import { BehaviorSubject, Subject } from 'rxjs';
import { CLOUD_FNS, COLLECTIONS } from 'src/app/constants';
import { Role } from 'src/app/types/user';

@Injectable({
  providedIn: 'root',
})
export class AuthService implements OnDestroy {
  private auth = inject(Auth);
  private db = inject(Firestore);
  private router = inject(Router);
  private functions = inject(Functions);
  private provider = new GoogleAuthProvider();

  setClaims = httpsCallable(this.functions, CLOUD_FNS.SET_CLAIMS);
  delUser = httpsCallable(this.functions, CLOUD_FNS.DEL_USER);

  user$ = user(this.auth);
  private uid: string | null = null;
  private _currentRole: Role = Role.NONE;
  private _currentUserEmail: string = '';
  private role = new Subject<Role>();
  role$ = this.role.asObservable();

  private loading = new BehaviorSubject<boolean>(false);
  loading$ = this.loading.asObservable();

  private unsubscribe: Unsubscribe;

  // Getters for synchronous access to current user data
  get currentUserEmail(): string {
    return this._currentUserEmail;
  }

  get currentRole(): Role {
    return this._currentRole;
  }

  get isAdmin(): boolean {
    return this._currentRole === Role.ADMIN;
  }

  get isStudent(): boolean {
    return this._currentRole === Role.STUDENT;
  }

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
      this._currentRole = Role.NONE;
      this._currentUserEmail = '';
      this.role.next(Role.NONE);
      this.loading.next(false);
      return;
    }
    
    // Update current user email
    this._currentUserEmail = user.email || '';
    
    let token = await user.getIdTokenResult(true);
    if (!token.claims['admin'] && !token.claims['student']) {
      // set and fetch claims for new user
      await this.setClaims({ uid: this.uid });
      token = await user.getIdTokenResult(true);
    }
    
    // Update current role and emit
    if (token.claims['admin']) {
      this._currentRole = Role.ADMIN;
      this.role.next(Role.ADMIN);
    } else if (token.claims['student']) {
      this._currentRole = Role.STUDENT;
      this.role.next(Role.STUDENT);
    } else {
      this._currentRole = Role.NONE;
      this.role.next(Role.NONE);
    }

    this.loading.next(false);
    if (!token.claims['admin'] && !token.claims['student']) {
      // invalid claim, logout user
      await signOut(this.auth);
      this.router.navigateByUrl('/login');
    }

    if (this.uid) {
      // update last access
      const ref = doc(this.db, COLLECTIONS.USERS, this.uid);
      updateDoc(ref, { lastAccessAt: Date.now(), accessCount: increment(1) });
    }
  }

  async signIn() {
    this.loading.next(true);
    setTimeout(() => signInWithPopup(this.auth, this.provider), 700);
  }

  async deleteCurrentUser() {
    if (!this.uid) return;
    await this.delUser({ uid: this.uid });
  }
}
