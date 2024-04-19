import { Injectable, OnDestroy, OnInit, inject } from '@angular/core';
import {
  Auth,
  getRedirectResult,
  onAuthStateChanged,
  signInWithRedirect,
  user,
} from '@angular/fire/auth';
import {
  Firestore,
  collection,
  collectionData,
  doc,
  query,
  updateDoc,
  where,
} from '@angular/fire/firestore';
import { MatSnackBar } from '@angular/material/snack-bar';
import { GoogleAuthProvider, UserCredential } from 'firebase/auth';
import { Subject, first } from 'rxjs';
import { Role } from '../models/user';

@Injectable({
  providedIn: 'root',
})
export class AuthService implements OnInit, OnDestroy {
  private users = 'users';
  private auth = inject(Auth);
  private firestore = inject(Firestore);
  private snackBar = inject(MatSnackBar);
  private provider = new GoogleAuthProvider();

  user$ = user(this.auth);

  private role = new Subject<Role>();
  role$ = this.role.asObservable();

  private unsubscribe = onAuthStateChanged(this.auth, (_user) => {
    if (_user) {
      _user.getIdTokenResult(true).then((token) => {
        if (token.claims['admin']) {
          this.role.next(Role.ADMIN);
        }
      });
      this.updateLastAccess(_user.email);
    } else {
      this.role.next(Role.NONE);
    }
  });

  ngOnInit(): void {
    // This will be called automatically by browser after user completed authentication
    // Known issues: Isn't supported by Safari & Firefox browsers
    getRedirectResult(this.auth)
      .then((result) => this.updateUser(result))
      .catch((error) => this.handleError(error));
  }

  ngOnDestroy(): void {
    this.unsubscribe();
  }

  async signIn() {
    signInWithRedirect(this.auth, this.provider);
  }

  updateLastAccess(email: string | null) {
    if (!email) return;
    const match = where('email', '==', email);
    const usersCol = collection(this.firestore, this.users);
    collectionData(query(usersCol, match), { idField: 'id' })
      .pipe(first())
      .subscribe(([_user]) => {
        const lastAccessAt = Date.now();
        updateDoc(doc(this.firestore, 'users', _user.id), { lastAccessAt });
      });
  }

  updateUser(auth: UserCredential | null) {
    if (!auth) return;
    const match = where('email', '==', auth.user.email);
    const usersCol = collection(this.firestore, this.users);
    collectionData(query(usersCol, match), { idField: 'id' })
      .pipe(first())
      .subscribe(([_user]) => {
        const docRef = doc(this.firestore, this.users, _user.id);
        const _update = {
          name: auth.user.displayName,
          createdAt: Date.parse(auth.user.metadata.creationTime || ''),
          loginCount: _user['loginCount'] + 1,
        };
        updateDoc(docRef, _update);
      });
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
