import { Location } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  OnDestroy,
  OnInit,
  inject,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  EMPTY,
  Observable,
  Subject,
  distinctUntilChanged,
  of,
  switchMap,
  takeUntil,
} from 'rxjs';
import { CreateReviewButtonService } from 'src/app/services/create-review-button.service';
import { UserService } from 'src/app/services/user.service';
import { Review } from 'src/app/types/review';
import { formatTime } from 'src/app/utils';

@Component({
  selector: 'app-reviews',
  templateUrl: './reviews.component.html',
  styleUrl: './reviews.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReviewsComponent implements OnInit, OnDestroy {
  private location = inject(Location);
  private route = inject(ActivatedRoute);
  private fireService = inject(UserService);
  private createReviewButtonService = inject(CreateReviewButtonService);
  private cdr = inject(ChangeDetectorRef);
  @Input() organization?: string;

  formatTime = formatTime;

  private organizationId: string = '';
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
        this.cdr.markForCheck();
      });

    // Optimized organization ID observable
    const organizationId$: Observable<string> = this.organization
      ? of(this.organization)
      : this.route.parent?.paramMap.pipe(
          takeUntil(this.destroy$),
          switchMap((map) => {
            const id = map.get('id');
            return id ? of(id) : EMPTY;
          }),
          distinctUntilChanged()
        ) || EMPTY;

    organizationId$
      .pipe(
        distinctUntilChanged(),
        switchMap((id: string) => {
          if (!id || id === this.organizationId) return EMPTY;
          this.organizationId = id;
          this.loading = true;
          this.cdr.markForCheck();
          return this.fireService.getReviews(id);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (reviews: Review[]) => {
          this.reviews = reviews;
          this.loading = false;
          this.cdr.markForCheck();
        },
        error: (error: any) => {
          console.error('Error loading reviews:', error);
          this.loading = false;
          this.cdr.markForCheck();
        },
      });
  }

  ngOnDestroy(): void {
    // Tell service to hide the create button
    this.createReviewButtonService.setButtonVisibility(false);
    this.destroy$.next();
    this.destroy$.complete();
  }

  onDelete(idx: number) {
    if (idx >= this.reviews.length) return;
    this.reviews.splice(idx, 1);
    this.cdr.markForCheck();
  }

  startCreateReview() {
    this.showCreateForm = true;
    this.cdr.markForCheck();
  }

  cancelCreateReview() {
    this.showCreateForm = false;
    this.cdr.markForCheck();
  }

  onReviewCreated() {
    this.showCreateForm = false;
    this.cdr.markForCheck();
    // Reviews will be automatically refreshed through the observable stream
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

  // TrackBy function for reviews list to optimize rendering
  trackByReviewId(index: number, review: Review): any {
    return review.id || index;
  }
}
