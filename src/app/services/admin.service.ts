import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  collectionCount,
  query,
  where,
} from '@angular/fire/firestore';
import { BehaviorSubject, Subject, combineLatest, map } from 'rxjs';
import { Role } from '../models/user';

@Injectable({
  providedIn: 'root',
})
export class AdminService {
  private firestore = inject(Firestore);

  private organizationsApproved = new Subject<number>();
  organizationsApproved$ = this.organizationsApproved.asObservable();
  private organizationsPending = new Subject<number>();
  organizationsPending$ = this.organizationsPending.asObservable();
  private reviewsTotal = new Subject<number>();
  reviewsTotal$ = this.reviewsTotal.asObservable();
  private usersStudent = new Subject<number>();
  usersStudent$ = this.usersStudent.asObservable();
  private usersAdmin = new Subject<number>();
  usersAdmin$ = this.usersAdmin.asObservable();

  private isLoading = new BehaviorSubject<boolean>(false);
  isLoading$ = this.isLoading.asObservable();

  constructor() {
    this.isLoading.next(true);
    const orgsCol = collection(this.firestore, 'organizations');
    const reviewsCol = collection(this.firestore, 'reviews');
    const usersCol = collection(this.firestore, 'users');
    const qOrgsApproved = query(orgsCol, where('approved', '==', true));
    const qOrgsUnapproved = query(orgsCol, where('approved', '==', false));
    const qReviews = query(reviewsCol);
    const qUsersStudent = query(usersCol, where('role', '==', Role.STUDENT));
    const qUsersAdmin = query(usersCol, where('role', '==', Role.ADMIN));

    const promises = [
      collectionCount(qOrgsApproved),
      collectionCount(qOrgsUnapproved),
      collectionCount(qReviews),
      collectionCount(qUsersStudent),
      collectionCount(qUsersAdmin),
    ];
    combineLatest(promises)
      .pipe(
        map(([approved, unapproved, revs, students, admins]) => {
          this.organizationsApproved.next(approved);
          this.organizationsPending.next(unapproved);
          this.reviewsTotal.next(revs);
          this.usersStudent.next(students);
          this.usersAdmin.next(admins);
        })
      )
      .subscribe((_) => this.isLoading.next(false));
  }
}
