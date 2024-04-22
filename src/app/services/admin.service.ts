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
import { ADMIN_STATS, COLLECTIONS } from 'src/app/constants';
import { Role, User } from 'src/app/types/user';

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
    [ADMIN_STATS.KEY_APPROVED, 0],
    [ADMIN_STATS.KEY_PENDING, 0],
    [ADMIN_STATS.KEY_REVIEWS, 0],
    [ADMIN_STATS.KEY_STUDENTS, 0],
    [ADMIN_STATS.KEY_ADMINS, 0],
  ]);
  private stats = new BehaviorSubject<Map<string, number>>(this.values);
  stats$ = this.stats.asObservable();

  constructor() {
    this.fetchStat(
      COLLECTIONS.ORGANIZATIONS,
      ADMIN_STATS.KEY_APPROVED,
      where('approved', '==', true)
    );
    this.fetchStat(
      COLLECTIONS.ORGANIZATIONS,
      ADMIN_STATS.KEY_PENDING,
      where('approved', '==', false)
    );
    this.fetchStat(COLLECTIONS.REVIEWS, ADMIN_STATS.KEY_REVIEWS);
    this.fetchStat(
      COLLECTIONS.USERS,
      ADMIN_STATS.KEY_ADMINS,
      where('role', '==', Role.ADMIN)
    );
    this.fetchStat(
      COLLECTIONS.USERS,
      ADMIN_STATS.KEY_STUDENTS,
      where('role', '==', Role.STUDENT)
    );
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
