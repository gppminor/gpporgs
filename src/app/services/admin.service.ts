import { Injectable, inject } from '@angular/core';
import {
  DocumentReference,
  Firestore,
  QueryFieldFilterConstraint,
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
import { BehaviorSubject, take } from 'rxjs';
import { COLLECTIONS } from '../constants';
import { Role, User } from '../types/user';

export const KEY_APPROVED = 'approved';
export const KEY_PENDING = 'pending';
export const KEY_REVIEWS = 'reviews';
export const KEY_STUDENTS = 'students';
export const KEY_ADMINS = 'admins';

@Injectable({
  providedIn: 'root',
})
export class AdminService {
  private db = inject(Firestore);

  private users = new BehaviorSubject<any[]>([]);
  users$ = this.users.asObservable();

  private organizations = new BehaviorSubject<any[]>([]);
  organizations$ = this.organizations.asObservable();

  // stats
  private values = new Map<string, number>([
    [KEY_APPROVED, 0],
    [KEY_PENDING, 0],
    [KEY_REVIEWS, 0],
    [KEY_STUDENTS, 0],
    [KEY_ADMINS, 0],
  ]);
  private stats = new BehaviorSubject<Map<string, number>>(this.values);
  stats$ = this.stats.asObservable();

  constructor() {
    let condition = where('approved', '==', true);
    this.fetchStat(COLLECTIONS.ORGANIZATIONS, KEY_APPROVED, condition);
    condition = where('approved', '==', false);
    this.fetchStat(COLLECTIONS.ORGANIZATIONS, KEY_PENDING, condition);
    this.fetchStat(COLLECTIONS.REVIEWS, KEY_REVIEWS);
    condition = where('role', '==', Role.ADMIN);
    this.fetchStat(COLLECTIONS.USERS, KEY_ADMINS, condition);
    condition = where('role', '==', Role.STUDENT);
    this.fetchStat(COLLECTIONS.USERS, KEY_STUDENTS, condition);
    this.fetchUsers();
    this.fetchOrganizations();
  }

  private fetchStat(
    colName: string,
    key: string,
    condition: QueryFieldFilterConstraint | undefined = undefined
  ) {
    const col = collection(this.db, colName);
    let observable = collectionCount(query(col));
    if (condition) {
      observable = collectionCount(query(col, condition));
    }
    observable.pipe(take(1)).subscribe((count) => {
      this.values.set(key, count);
      this.stats.next(this.values);
    });
  }

  private fetchUsers() {
    const id = { idField: 'id' };
    const col = collection(this.db, COLLECTIONS.USERS);
    collectionData(query(col, orderBy('name', 'asc')), id)
      .pipe(take(1))
      .subscribe((data) => this.users.next(data));
  }

  // TODO:
  private fetchOrganizations() {}

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
