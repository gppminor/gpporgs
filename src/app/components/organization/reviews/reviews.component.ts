import { Location } from '@angular/common';
import { Component, Input, OnDestroy, OnInit, inject } from '@angular/core';
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
  private location = inject(Location);
  private route = inject(ActivatedRoute);
  private fireService = inject(UserService);
  @Input() organization?: string;

  formatTime = formatTime;

  private organizationId: string;
  reviews: Review[] = [];
  loading = false;
  processing = false;
  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    if (this.organization) {
      this.getReviews(this.organization);
    } else {
      this.route.parent?.paramMap
        .pipe(takeUntil(this.destroy$))
        .subscribe((map) => this.getReviews(map.get('id')));
    }
  }

  ngOnDestroy(): void {
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

  goBack() {
    this.location.back();
  }
}
