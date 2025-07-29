import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  addDoc,
  collection,
  collectionData,
  doc,
  docData,
  orderBy,
  query,
  where,
} from '@angular/fire/firestore';
import { BehaviorSubject, Observable, take, map, switchMap } from 'rxjs';
import { COLLECTIONS } from 'src/app/constants';
import { Filter } from '../types/filter';
import { AuthService } from './auth.service';
import { Role } from '../types/user';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private db = inject(Firestore);
  private authService = inject(AuthService);

  readonly affiliations = new Map<string, string>();
  readonly countries = new Map<string, string>();
  readonly languages = new Map<string, string>();
  readonly regions = new Map<string, string>();
  readonly sectors = new Map<string, string>();
  readonly types = new Map<string, string>();

  private pendingLoad = 7;
  private loading = new BehaviorSubject<boolean>(false);
  loading$ = this.loading.asObservable();

  private organizations = new BehaviorSubject<any[]>([]);
  organizations$ = this.organizations.asObservable();

  filterValues = new BehaviorSubject(new Filter());

  constructor() {
    this.loading.next(true);
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
      .subscribe((data) => {
        data.forEach(({ id, code, name }) => store.set(id || code, name));
        this.pendingLoad--;
        if (this.pendingLoad == 0) this.loading.next(false);
      });
  }

  private fetchOrganizations() {
    const id = { idField: 'id' };
    const col = collection(this.db, COLLECTIONS.ORGANIZATIONS);
    const condition = where('approved', '==', true);
    collectionData(query(col, condition, orderBy('name', 'asc')), id)
      .pipe(take(1))
      .subscribe((data) => {
        this.organizations.next(data);
        this.pendingLoad--;
        if (this.pendingLoad == 0) this.loading.next(false);
      });
  }

  getOrganization(id: string): Observable<any> {
    return docData(doc(this.db, COLLECTIONS.ORGANIZATIONS, id));
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
    
    // Get reviews and combine with user role and email to handle anonymous reviews
    return this.authService.role$.pipe(
      switchMap(userRole => 
        this.authService.user$.pipe(
          switchMap(currentUser => 
            collectionData(query(col, condition, order), { idField: 'id' }).pipe(
              map((reviews: any[]) => 
                reviews.map(review => {
                  // If review is anonymous, check if user is admin or if it's their own review
                  if (review.anonymous) {
                    const isAdmin = userRole === Role.ADMIN;
                    const isOwnReview = currentUser?.email === review.reviewer?.email;
                    
                    // Show reviewer email only if user is admin or it's their own review
                    if (!isAdmin && !isOwnReview) {
                      return {
                        ...review,
                        reviewer: null // Hide reviewer object for anonymous reviews
                      };
                    }
                  }
                  return review;
                })
              )
            )
          )
        )
      )
    );
  }

  getReview(id: string): Observable<any> {
    const docRef = doc(this.db, COLLECTIONS.REVIEWS, id);
    return docData(docRef, { idField: 'id' });
  }

  addReview(data: any): Promise<string> {
    const ref = collection(this.db, COLLECTIONS.REVIEWS);
    return addDoc(ref, data).then((docRef) => docRef.id);
  }

  addAddress(data: any): Promise<string> {
    const ref = collection(this.db, COLLECTIONS.ADDRESSES);
    return addDoc(ref, data).then((docRef) => docRef.id);
  }
}
