import { Injectable, inject } from '@angular/core';
import {
  DocumentReference,
  Firestore,
  addDoc,
  collection,
  collectionCount,
  collectionData,
  deleteDoc,
  doc,
  orderBy,
  query,
  updateDoc,
  where,
} from '@angular/fire/firestore';
import { BehaviorSubject, Observable, take } from 'rxjs';
import { COLLECTIONS } from '../constants';
import { Role, User } from '../types/user';

@Injectable({
  providedIn: 'root',
})
export class AdminService {
  private db = inject(Firestore);

  private users = new BehaviorSubject<any[]>([]);
  users$ = this.users.asObservable();

  constructor() {
    this.fetchUsers();
  }

  private fetchUsers() {
    const id = { idField: 'id' };
    const col = collection(this.db, COLLECTIONS.USERS);
    collectionData(query(col, orderBy('name', 'asc')), id)
      .pipe(take(1))
      .subscribe((data) => this.users.next(data));
  }

  countOrganizations(approved: boolean): Observable<number> {
    const col = collection(this.db, COLLECTIONS.ORGANIZATIONS);
    return collectionCount(query(col, where('approved', '==', approved)));
  }

  countReviews(): Observable<number> {
    const col = collection(this.db, COLLECTIONS.REVIEWS);
    return collectionCount(query(col));
  }

  countUsers(role: Role): Observable<number> {
    const col = collection(this.db, COLLECTIONS.USERS);
    return collectionCount(query(col, where('role', '==', role)));
  }

  async addUser(userInfo: User): Promise<DocumentReference> {
    const col = collection(this.db, COLLECTIONS.USERS);
    return addDoc(col, userInfo);
  }

  updateUser(id: string, partial: any): Promise<void> {
    const user = doc(this.db, COLLECTIONS.USERS, id);
    return updateDoc(user, partial);
  }

  deleteUser(id: string): Promise<void> {
    const col = collection(this.db, COLLECTIONS.USERS);
    return deleteDoc(doc(col, id));
  }
}
