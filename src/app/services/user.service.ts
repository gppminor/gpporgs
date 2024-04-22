import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  collectionData,
  doc,
  docData,
  orderBy,
  query,
  updateDoc,
  where,
} from '@angular/fire/firestore';
import { BehaviorSubject, Observable, take } from 'rxjs';
import { COLLECTIONS } from 'src/app/constants';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private db = inject(Firestore);

  readonly affiliations = new Map<string, string>();
  readonly countries = new Map<string, string>();
  readonly languages = new Map<string, string>();
  readonly regions = new Map<string, string>();
  readonly sectors = new Map<string, string>();
  readonly types = new Map<string, string>();

  private pendingLoad = 6;
  private ready = new BehaviorSubject<boolean>(false);
  ready$ = this.ready.asObservable();

  private organizations = new BehaviorSubject<any[]>([]);
  organizations$ = this.organizations.asObservable();

  constructor() {
    this.fetchData(COLLECTIONS.AFFILIATIONS, this.affiliations);
    this.fetchData(COLLECTIONS.COUNTRIES, this.countries);
    this.fetchData(COLLECTIONS.LANGUAGES, this.languages);
    this.fetchData(COLLECTIONS.REGIONS, this.regions);
    this.fetchData(COLLECTIONS.SECTORS, this.sectors);
    this.fetchData(COLLECTIONS.TYPES, this.types);
    this.fetchOrganizations();
  }

  private fetchData(col: string, store: Map<any, any>) {
    const id = { idField: 'id' };
    collectionData(collection(this.db, col), id)
      .pipe(take(1))
      .subscribe((_data) => {
        _data.forEach(({ id, code, name }) => store.set(id || code, name));
        this.pendingLoad--;
        if (this.pendingLoad == 0) {
          this.ready.next(true);
        }
      });
  }

  private fetchOrganizations() {
    const id = { idField: 'id' };
    const col = collection(this.db, COLLECTIONS.ORGANIZATIONS);
    const condition = where('approved', '==', true);
    collectionData(query(col, condition, orderBy('name', 'asc')), id)
      .pipe(take(1))
      .subscribe((data) => this.organizations.next(data));
  }

  getOrganization(id: string): Observable<any> {
    return docData(doc(this.db, COLLECTIONS.ORGANIZATIONS, id));
  }

  async updateOrganization(id: string, partial: any): Promise<void> {
    const docRef = doc(this.db, COLLECTIONS.ORGANIZATIONS, id);
    await updateDoc(docRef, partial);
  }

  getAddress(id: string): Observable<any> {
    const docRef = doc(this.db, COLLECTIONS.ADDRESSES, id);
    return docData(docRef);
  }

  getContact(id: string): Observable<any> {
    const docRef = doc(this.db, COLLECTIONS.CONTACTS, id);
    return docData(docRef, { idField: 'id' });
  }

  getReviews(organizationId: string): Observable<any[]> {
    const order = orderBy('createdAt', 'desc');
    const condition = where('organization', '==', organizationId);
    const col = collection(this.db, COLLECTIONS.REVIEWS);
    return collectionData(query(col, condition, order));
  }
}
