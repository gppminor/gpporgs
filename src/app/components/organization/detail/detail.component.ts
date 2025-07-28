import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { filter, Subject, takeUntil } from 'rxjs';
import { CreateReviewButtonService } from 'src/app/services/create-review-button.service';

@Component({
  selector: 'app-detail',
  templateUrl: './detail.component.html',
  styleUrl: './detail.component.scss',
})
export class DetailComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private createReviewButtonService = inject(CreateReviewButtonService);
  private organizationId: string | null = null;
  private destroy$ = new Subject<void>();

  private reviewsMatch = /^\/organization\/([^\/]+)\/reviews$/;
  isDetailView = false;
  isReviewsView = false;
  showCreateButton = false;

  constructor() {
    this.organizationId = this.route.snapshot.paramMap.get('id');
    this.updateViewStates();
  }

  ngOnInit(): void {
    // Listen for button visibility changes
    this.createReviewButtonService.showButton$
      .pipe(takeUntil(this.destroy$))
      .subscribe((show) => {
        this.showCreateButton = show;
      });

    // Listen for route changes to update view states
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.updateViewStates();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private updateViewStates(): void {
    this.isReviewsView = this.router.url.match(this.reviewsMatch) != null;
    this.isDetailView = !this.isReviewsView;
  }

  home() {
    this.router.navigate(['/']);
  }

  organization() {
    this.isDetailView = true;
    this.isReviewsView = false;
    this.router.navigate(['/organization', this.organizationId]);
  }

  reviews() {
    this.isDetailView = false;
    this.isReviewsView = true;
    this.router.navigate(['/organization', this.organizationId, 'reviews']);
  }

  onCreateReview() {
    this.createReviewButtonService.triggerCreateClick();
  }
}
