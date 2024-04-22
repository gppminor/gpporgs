import { Location } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { UserService } from 'src/app/services/user.service';
import { Review } from 'src/app/types/review';
import { formatTime } from 'src/app/utils';

@Component({
  selector: 'app-reviews',
  templateUrl: './reviews.component.html',
  styleUrl: './reviews.component.scss',
})
export class ReviewsComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private location = inject(Location);
  private route = inject(ActivatedRoute);
  private fireService = inject(UserService);

  formatTime = formatTime;

  // formGroup = this.fb.group({});
  reviews: Review[];
  isLoading = false;

  // For auto-unsubscribe
  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    const organizationId = this.route.snapshot.paramMap.get('id');
    if (organizationId) this.fetchReview(organizationId);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private fetchReview(organizationId: string) {
    this.isLoading = true;
    this.reviews = [];
    this.fireService
      .getReviews(organizationId)
      .pipe(takeUntil(this.destroy$))
      .subscribe((_reviews) => {
        // const reviewControls = [];
        for (let _review of _reviews) {
          // const reviewControl: any = {};
          // for (let key of Object.keys(new Review())) {
          //   reviewControl[key] = _review[key];
          // }
          // reviewControls.push(this.fb.group(reviewControl));
          this.reviews.push(_review);
          // this.fetchAddress(_review.address);
        }
        // this.formGroup.addControl('reviews', this.fb.array(reviewControls));
        this.isLoading = false;
      });
  }

  private fetchAddress(id: string) {}

  goBack() {
    this.location.back();
  }
}
