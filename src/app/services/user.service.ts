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
import { BehaviorSubject, Observable, map, shareReplay, take } from 'rxjs';
import { COLLECTIONS } from 'src/app/constants';
import { Filter } from '../types/filter';
import { AuthService } from './auth.service';

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

  // Cache flags to prevent multiple fetches
  private dataFetched = new Set<string>();
  private organizationsFetched = false;

  constructor() {
    this.initializeStaticData();
  }

  private initializeStaticData(): void {
    // Only initialize if not already done
    if (this.dataFetched.size === 0) {
      this.loading.next(true);
      this.fetchData(COLLECTIONS.AFFILIATIONS, this.affiliations);
      this.fetchData(COLLECTIONS.COUNTRIES, this.countries);
      this.fetchData(COLLECTIONS.LANGUAGES, this.languages);
      this.fetchData(COLLECTIONS.REGIONS, this.regions);
      this.fetchData(COLLECTIONS.SECTORS, this.sectors);
      this.fetchData(COLLECTIONS.TYPES, this.types);
      this.fetchOrganizations();
    }
  }

  private fetchData(col: string, store: Map<any, any>) {
    // Prevent multiple fetches of the same collection
    if (this.dataFetched.has(col)) {
      this.pendingLoad--;
      if (this.pendingLoad <= 0) this.loading.next(false);
      return;
    }

    const id = { idField: 'id' };
    collectionData(query(collection(this.db, col), orderBy('name', 'asc')), id)
      .pipe(
        take(1),
        shareReplay(1) // Cache the result
      )
      .subscribe({
        next: (data) => {
          data.forEach(({ id, code, name }) => store.set(id || code, name));
          this.dataFetched.add(col); // Mark as fetched
          this.pendingLoad--;
          if (this.pendingLoad <= 0) this.loading.next(false);
        },
        error: (error) => {
          console.error(`Error fetching ${col}:`, error);
          this.pendingLoad--;
          if (this.pendingLoad <= 0) this.loading.next(false);
        },
      });
  }

  private fetchOrganizations() {
    // Prevent multiple fetches
    if (this.organizationsFetched) {
      this.pendingLoad--;
      if (this.pendingLoad <= 0) this.loading.next(false);
      return;
    }

    const id = { idField: 'id' };
    const col = collection(this.db, COLLECTIONS.ORGANIZATIONS);
    const condition = where('approved', '==', true);

    collectionData(query(col, condition, orderBy('name', 'asc')), id)
      .pipe(
        take(1),
        shareReplay(1) // Cache the organizations list
      )
      .subscribe({
        next: (data) => {
          this.organizations.next(data);
          this.organizationsFetched = true; // Mark as fetched
          this.pendingLoad--;
          if (this.pendingLoad <= 0) this.loading.next(false);
        },
        error: (error) => {
          console.error('Error fetching organizations:', error);
          this.pendingLoad--;
          if (this.pendingLoad <= 0) this.loading.next(false);
        },
      });
  }

  // Cache for organizations to prevent redundant fetches
  private organizationCache = new Map<string, Observable<any>>();
  private addressCache = new Map<string, Observable<any>>();
  private contactCache = new Map<string, Observable<any>>();
  private reviewsCache = new Map<string, Observable<any[]>>();

  getOrganization(id: string): Observable<any> {
    if (!this.organizationCache.has(id)) {
      const organization$ = docData(
        doc(this.db, COLLECTIONS.ORGANIZATIONS, id)
      ).pipe(
        shareReplay(1) // Cache the latest result
      );
      this.organizationCache.set(id, organization$);
    }
    return this.organizationCache.get(id)!;
  }

  getAddress(id: string): Observable<any> {
    if (!this.addressCache.has(id)) {
      const address$ = docData(doc(this.db, COLLECTIONS.ADDRESSES, id)).pipe(
        shareReplay(1) // Cache the latest result
      );
      this.addressCache.set(id, address$);
    }
    return this.addressCache.get(id)!;
  }

  getContact(id: string): Observable<any> {
    if (!this.contactCache.has(id)) {
      const contact$ = docData(doc(this.db, COLLECTIONS.CONTACTS, id), {
        idField: 'id',
      }).pipe(
        shareReplay(1) // Cache the latest result
      );
      this.contactCache.set(id, contact$);
    }
    return this.contactCache.get(id)!;
  }

  // Method to clear caches when needed (e.g., after updates)
  clearOrganizationCache(id?: string): void {
    if (id) {
      this.organizationCache.delete(id);
    } else {
      this.organizationCache.clear();
    }
  }

  clearAddressCache(id?: string): void {
    if (id) {
      this.addressCache.delete(id);
    } else {
      this.addressCache.clear();
    }
  }

  clearContactCache(id?: string): void {
    if (id) {
      this.contactCache.delete(id);
    } else {
      this.contactCache.clear();
    }
  }

  getReviews(organizationId: string): Observable<any[]> {
    if (!this.reviewsCache.has(organizationId)) {
      const order = orderBy('createdAt', 'desc');
      const condition = where('organization', '==', organizationId);
      const col = collection(this.db, COLLECTIONS.REVIEWS);

      const reviews$ = collectionData(query(col, condition, order), {
        idField: 'id',
      }).pipe(
        map((reviews: any[]) =>
          reviews.map((review) => {
            // Handle anonymous review visibility using synchronous getters
            if (review.anonymous) {
              const isAdmin = this.authService.isAdmin;
              const currentUserEmail = this.authService.currentUserEmail;
              const isOwnReview = currentUserEmail === review.reviewer?.email;

              // Hide reviewer info for anonymous reviews (except for admins and own reviews)
              if (!isAdmin && !isOwnReview) {
                return {
                  ...review,
                  reviewer: null,
                };
              }
            }
            return review;
          })
        ),
        shareReplay(1) // Cache the result to avoid redundant queries
      );

      this.reviewsCache.set(organizationId, reviews$);
    }
    return this.reviewsCache.get(organizationId)!;
  }

  clearReviewsCache(organizationId?: string): void {
    if (organizationId) {
      this.reviewsCache.delete(organizationId);
    } else {
      this.reviewsCache.clear();
    }
  }

  getReview(id: string): Observable<any> {
    const docRef = doc(this.db, COLLECTIONS.REVIEWS, id);
    return docData(docRef, { idField: 'id' });
  }

  addReview(data: any): Promise<string> {
    const ref = collection(this.db, COLLECTIONS.REVIEWS);
    this.clearReviewsCache(data.organization); // Invalidate cache for the organization
    return addDoc(ref, data).then((docRef) => docRef.id);
  }

  addAddress(data: any): Promise<string> {
    const ref = collection(this.db, COLLECTIONS.ADDRESSES);
    return addDoc(ref, data).then((docRef) => docRef.id);
  }

  // Methods to refresh data when needed
  refreshStaticData(): void {
    this.dataFetched.clear();
    this.organizationsFetched = false;
    this.pendingLoad = 7;
    this.initializeStaticData();
  }

  refreshOrganizations(): void {
    this.organizationsFetched = false;
    this.fetchOrganizations();
  }

  // Method to clear all caches
  clearAllCaches(): void {
    this.organizationCache.clear();
    this.addressCache.clear();
    this.contactCache.clear();
    this.reviewsCache.clear();
    this.dataFetched.clear();
    this.organizationsFetched = false;
  }
}
