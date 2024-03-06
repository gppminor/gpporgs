import { Injectable, inject } from '@angular/core';
import { Firestore, collection, collectionData, doc, query, updateDoc, where } from '@angular/fire/firestore';
import { UserCredential } from 'firebase/auth';
import { Subject, first } from 'rxjs';
import { Role } from '../models/user';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private users = 'users';
  private firestore = inject(Firestore);

  private role = new Subject<Role>();
  role$ = this.role.asObservable();

  setRole(role: Role) {
    this.role.next(role);
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
    collectionData(query(usersCol, match), {idField: 'id'})
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
}
