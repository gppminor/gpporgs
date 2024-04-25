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

  private organizationId: string;
  reviews: Review[];
  loading = false;
  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.route.parent?.paramMap
      .pipe(takeUntil(this.destroy$))
      .subscribe((map) => this.getReviews(map.get('id')));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private getReviews(id: string | null) {
    if (!id || id === this.organizationId) return;
    this.organizationId = id;
    this.loading = true;
    this.reviews = [];
    this.fireService
      .getReviews(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe((_reviews) => {
        for (let _review of _reviews) {
          this.reviews.push(_review);
        }
        this.loading = false;
      });
  }

  private fetchAddress(id: string) {}

  goBack() {
    this.location.back();
  }
}
