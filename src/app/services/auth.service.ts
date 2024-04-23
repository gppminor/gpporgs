import { Injectable, OnDestroy, inject } from '@angular/core';
import {
  Auth,
  deleteUser,
  onAuthStateChanged,
  signInWithRedirect,
  user,
} from '@angular/fire/auth';
import {
  Firestore,
  Unsubscribe,
  deleteDoc,
  doc,
} from '@angular/fire/firestore';
import { Functions, httpsCallable } from '@angular/fire/functions';
import { MatSnackBar } from '@angular/material/snack-bar';
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
  private snackBar = inject(MatSnackBar);
  private functions = inject(Functions);
  private provider = new GoogleAuthProvider();

  setClaims = httpsCallable(this.functions, CLOUD_FNS.SET_CLAIMS);

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
    await this.setClaims(); // set claims on cloud function
    const token = await user.getIdTokenResult(true);
    if (token.claims['admin']) this.role.next(Role.ADMIN);
    if (token.claims['student']) this.role.next(Role.STUDENT);

    this.loading.next(false);
  }

  async signIn() {
    this.loading.next(true);
    setTimeout(() => signInWithRedirect(this.auth, this.provider), 700);
  }

  async deleteCurrentUser() {
    if (!this.uid || !this.auth.currentUser) return;
    const uid = this.uid.toString();
    await deleteUser(this.auth.currentUser);
    await deleteDoc(doc(this.db, COLLECTIONS.USERS, uid));
  }
}
