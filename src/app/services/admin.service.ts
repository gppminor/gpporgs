import { Injectable, OnDestroy, inject } from '@angular/core';
import {
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
import { BehaviorSubject, Observable, Subject, takeUntil } from 'rxjs';
import { COLLECTIONS } from '../constants';
import { Role, User } from '../types/user';

@Injectable({
  providedIn: 'root',
})
export class AdminService implements OnDestroy {
  private firestore = inject(Firestore);

  private isLoading = new BehaviorSubject<boolean>(false);
  isLoading$ = this.isLoading.asObservable();

  private users = new BehaviorSubject<User[]>([]);
  users$ = this.users.asObservable();

  private destroy$ = new Subject<void>();

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  countOrganizations(approved: boolean): Observable<number> {
    const col = collection(this.firestore, COLLECTIONS.ORGANIZATIONS);
    return collectionCount(query(col, where('approved', '==', approved)));
  }

  countReviews(): Observable<number> {
    const col = collection(this.firestore, COLLECTIONS.REVIEWS);
    return collectionCount(query(col));
  }

  countUsers(role: Role): Observable<number> {
    const col = collection(this.firestore, COLLECTIONS.USERS);
    return collectionCount(query(col, where('role', '==', role)));
  }

  async addUser(email: string, role: Role | null): Promise<string> {
    try {
      const col = collection(this.firestore, COLLECTIONS.USERS);
      const user: User = {
        email,
        role: role || Role.STUDENT,
        createdAt: Date.now(),
        lastAccessAt: 0,
        loginCount: 0,
        name: '',
      };
      const doc = await addDoc(col, user);
      user.id = doc.id;
      const _users = this.users.getValue();
      _users.push(user);
      this.users.next(_users);
      return 'User successfully added';
    } catch (error) {
      return 'Error adding user';
    }
  }

  async updateUser(id: string, email: string, role: Role): Promise<string> {
    try {
      const user = doc(this.firestore, COLLECTIONS.USERS, id);
      await updateDoc(user, { email, role });
      return 'User successfully updated';
    } catch (error) {
      return 'Error updating user';
    }
  }

  async getUsers(): Promise<void> {
    const order = orderBy('name', 'asc');
    const col = collection(this.firestore, COLLECTIONS.USERS);
    this.isLoading.next(true);
    collectionData(query(col, order /*, limit(5)*/), { idField: 'id' })
      .pipe(takeUntil(this.destroy$))
      .subscribe((_users) => {
        this.users.next(_users as User[]);
        this.isLoading.next(false);
      });
  }

  async deleteUser(id: string): Promise<string> {
    try {
      const col = collection(this.firestore, COLLECTIONS.USERS);
      await deleteDoc(doc(col, id));
      const _users = this.users.getValue();
      const index = _users.findIndex((user) => user.id === id);
      _users.splice(index, 1);
      this.users.next(_users);
      return 'User deleted successfully';
    } catch (error) {
      return 'Error deleting user';
    }
  }
}
