import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  QueryFieldFilterConstraint,
  addDoc,
  collection,
  collectionCount,
  collectionData,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from '@angular/fire/firestore';
import { Functions, httpsCallable } from '@angular/fire/functions';
import { BehaviorSubject, take } from 'rxjs';
import { ADMIN_STATS, CLOUD_FNS, COLLECTIONS } from 'src/app/constants';
import { Organization } from 'src/app/types/organization';
import { Role, User } from 'src/app/types/user';

@Injectable({
  providedIn: 'root',
})
export class AdminService {
  private db = inject(Firestore);
  private functions = inject(Functions);

  private users = new BehaviorSubject<User[]>([]);
  users$ = this.users.asObservable();

  private organizations = new BehaviorSubject<Organization[]>([]);
  organizations$ = this.organizations.asObservable();

  setClaims = httpsCallable(this.functions, CLOUD_FNS.SET_CLAIMS);
  delUser = httpsCallable(this.functions, CLOUD_FNS.DEL_USER);

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

  private loading = new BehaviorSubject<boolean>(false);
  loading$ = this.loading.asObservable();

  constructor() {
    this.loading.next(true);
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
    collectionData(query(col), id)
      .pipe(take(1))
      .subscribe((data) => {
        this.users.next(data as User[]);
        this.loading.next(false);
      });
  }

  private fetchOrganizations() {
    const id = { idField: 'id' };
    const col = collection(this.db, COLLECTIONS.ORGANIZATIONS);
    collectionData(query(col, orderBy('name', 'asc')), id)
      .pipe(take(1))
      .subscribe((data) => {
        this.organizations.next(data as Organization[]);
        this.loading.next(false);
      });
  }

  async addUser(email: string, role: Role): Promise<boolean> {
    let result = true;
    try {
      const user: any = { email, role };
      const ref = doc(this.db, COLLECTIONS.USERS, email);
      await setDoc(ref, user);
      user.id = email;
      const users = [...this.users.getValue(), user];
      this.users.next(users);
    } catch {
      result = false;
    }
    return result;
  }

  async updateUser(id: string, email: string, role: Role): Promise<boolean> {
    let result = true;
    try {
      const user = { email, role };
      const ref = doc(this.db, COLLECTIONS.USERS, id);
      await updateDoc(ref, user);
      const users = this.users.getValue().map((user) => {
        if (user.id !== id) return user;
        if (user.role !== role) {
          // update user claims on firebase auth
          this.setClaims({ uid: id });
        }
        return { ...user, email, role };
      });
      this.users.next(users);
    } catch {
      result = false;
    }
    return result;
  }

  async deleteUser(uid: string): Promise<boolean> {
    let result = true;
    try {
      await this.delUser({ uid });
      const users = this.users.getValue().filter((user) => user.id !== uid);
      this.users.next(users);
    } catch {
      result = false;
    }
    return result;
  }

  async addOrganization(data: any): Promise<string> {
    const ref = collection(this.db, COLLECTIONS.ORGANIZATIONS);
    return (await addDoc(ref, data)).id;
  }

  updateOrganization(id: string, data: any): Promise<void> {
    const ref = doc(this.db, COLLECTIONS.ORGANIZATIONS, id);
    return updateDoc(ref, data);
  }

  async deleteOrganization(id: string): Promise<void> {
    const ref = doc(this.db, COLLECTIONS.ORGANIZATIONS, id);
    await deleteDoc(ref);
    const orgs = this.organizations.getValue().filter((org) => org.id !== id);
    this.organizations.next(orgs);
  }

  async addAddress(data: any): Promise<string> {
    const ref = collection(this.db, COLLECTIONS.ADDRESSES);
    return (await addDoc(ref, data)).id;
  }

  updateAddress(id: string, data: any): Promise<void> {
    const ref = doc(this.db, COLLECTIONS.ADDRESSES, id);
    return updateDoc(ref, data as any);
  }

  deleteAddress(id: string): Promise<void> {
    const ref = doc(this.db, COLLECTIONS.ADDRESSES, id);
    return deleteDoc(ref);
  }

  async addContact(data: any): Promise<string> {
    const ref = collection(this.db, COLLECTIONS.CONTACTS);
    return (await addDoc(ref, data)).id;
  }

  updateContact(id: string, data: any): Promise<void> {
    const ref = doc(this.db, COLLECTIONS.CONTACTS, id);
    return updateDoc(ref, data as any);
  }

  deleteContact(id: string): Promise<void> {
    const ref = doc(this.db, COLLECTIONS.CONTACTS, id);
    return deleteDoc(ref);
  }

  updateReview(id: string, data: any): Promise<void> {
    const ref = doc(this.db, COLLECTIONS.REVIEWS, id);
    return updateDoc(ref, data as any);
  }

  deleteReview(id: string): Promise<void> {
    const ref = doc(this.db, COLLECTIONS.REVIEWS, id);
    return deleteDoc(ref);
  }

  async deleteReviews(organization: string): Promise<void> {
    const snapshot = await getDocs(
      query(
        collection(this.db, COLLECTIONS.REVIEWS),
        where('organization', '==', organization)
      )
    );

    const batch = writeBatch(this.db);
    snapshot.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();
  }
}
