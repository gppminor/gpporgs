import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-detail',
  templateUrl: './detail.component.html',
  styleUrl: './detail.component.scss',
})
export class DetailComponent {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private organizationId: string | null = null;

  private reviewsMatch = /^\/organization\/([^\/]+)\/reviews$/;
  isDetailView = false;
  isReviewsView = false;

  constructor() {
    this.organizationId = this.route.snapshot.paramMap.get('id');
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
}
