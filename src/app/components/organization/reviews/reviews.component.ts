import { Location } from '@angular/common';
import { Component, Input, OnDestroy, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { CreateReviewButtonService } from 'src/app/services/create-review-button.service';
import { UserService } from 'src/app/services/user.service';
import { Review } from 'src/app/types/review';
import { formatTime } from 'src/app/utils';

@Component({
  selector: 'app-reviews',
  templateUrl: './reviews.component.html',
  styleUrl: './reviews.component.scss',
})
export class ReviewsComponent implements OnInit, OnDestroy {
  private location = inject(Location);
  private route = inject(ActivatedRoute);
  private fireService = inject(UserService);
  private createReviewButtonService = inject(CreateReviewButtonService);
  @Input() organization?: string;

  formatTime = formatTime;

  private organizationId: string;
  reviews: Review[] = [];
  loading = false;
  processing = false;
  showCreateForm = false;
  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    // Tell service to show the create button
    this.createReviewButtonService.setButtonVisibility(true);

    // Listen for create button clicks
    this.createReviewButtonService.createClick$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.startCreateReview();
      });

    if (this.organization) {
      this.getReviews(this.organization);
    } else {
      this.route.parent?.paramMap
        .pipe(takeUntil(this.destroy$))
        .subscribe((map) => this.getReviews(map.get('id')));
    }
  }

  ngOnDestroy(): void {
    // Tell service to hide the create button
    this.createReviewButtonService.setButtonVisibility(false);
    this.destroy$.next();
    this.destroy$.complete();
  }

  private getReviews(id: string | null) {
    if (!id || id === this.organizationId) return;
    this.organizationId = id;
    this.loading = true;
    this.fireService
      .getReviews(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe((_reviews) => {
        this.reviews = _reviews;
        this.loading = false;
      });
  }

  onDelete(idx: number) {
    if (idx >= this.reviews.length) return;
    this.reviews.splice(idx, 1);
  }

  startCreateReview() {
    this.showCreateForm = true;
  }

  cancelCreateReview() {
    this.showCreateForm = false;
  }

  onReviewCreated() {
    this.showCreateForm = false;
    // Refresh the reviews list
    this.getReviews(this.organizationId);
  }

  getNewReviewData() {
    return {
      ...new Review(),
      address: '', // Will be handled by the review component
    };
  }

  goBack() {
    this.location.back();
  }
}
