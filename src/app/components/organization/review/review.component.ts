import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { Component, inject, Input, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { MatChipInputEvent } from '@angular/material/chips';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { UserService } from 'src/app/services/user.service';
import { Address } from 'src/app/types/address';
import { Action } from 'src/app/types/enums';
import { Review } from 'src/app/types/review';
import { valueChanged } from 'src/app/utils';

@Component({
  selector: 'app-review',
  templateUrl: './review.component.html',
  styleUrl: './review.component.scss',
})
export class ReviewComponent implements OnInit {
  private fb = inject(FormBuilder);
  fireService = inject(UserService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  @Input() data!: any;
  @Input() action?: Action;

  Action = Action;
  formGroup = this.fb.group({});
  isLoading = false;
  isReadOnly: boolean = true;
  canSave = false;
  readonly separatorKeysCodes = [ENTER, COMMA] as const;

  private original = {};
  // For auto-unsubscribe
  private destroy$ = new Subject<void>();

  constructor() {
    // this.isReadOnly = !this.router.url.startsWith('/admin/');
  }

  ngOnInit(): void {
    this.initControls();
    this.fetchAddress();
    this.formGroup.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        if (this.isLoading) return;
        this.canSave = !valueChanged(value, this.original);
      });
    // this.isReadOnly = !this.router.url.startsWith('/admin/');
    this.isReadOnly = !this.route.snapshot.pathFromRoot
      .map((path) => path.url.map((seg) => seg.path).join('/'))
      .join('/')
      .startsWith('/admin');
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  initControls() {
    for (const key of Object.keys(new Review())) {
      this.formGroup.addControl(key, this.fb.control(this.data[key] || '-'));
    }
    this.original = JSON.parse(JSON.stringify(this.formGroup.value));
  }

  fetchAddress() {
    this.isLoading = true;
    this.fireService
      .getAddress(this.data.address)
      .pipe(takeUntil(this.destroy$))
      .subscribe((result) => {
        this.data['address'] = result;
        const controls: any = {};
        for (const key of Object.keys(new Address())) {
          controls[key] = result[key] || '-';
        }
        this.formGroup.addControl('address', this.fb.group(controls));
        this.original = JSON.parse(JSON.stringify(this.formGroup.value));
        this.isLoading = false;
      });
  }

  getCountry(): string {
    return this.fireService.countries.get(this.data.address.country) || '-';
  }

  getRegion(): string {
    let value = this.fireService.regions.get(this.data.region);
    if (value?.toLowerCase().includes('other') && this.data.otherRegion) {
      value = this.data.otherRegion;
    }
    return value || '-';
  }

  getLanguages(): string[] {
    return this.data.languages.map((code: string) =>
      this.fireService.languages.get(code)
    );
  }

  addLanguage(event: MatChipInputEvent): void {
    console.log(event.value);
  }

  getType(): string {
    let value = this.fireService.types.get(this.data.type);
    if (value?.toLowerCase().includes('other') && this.data.otherType) {
      value = this.data.otherType;
    }
    return value || '-';
  }

  getSectors(): string {
    let values: string[] = [];
    for (const id of this.data.sectors) {
      let value = this.fireService.sectors.get(id);
      if (value?.toLowerCase().includes('other') && this.data.otherSector) {
        value = this.data.otherSector;
      }
      if (value) values.push(value);
    }
    return values.join(', ');
  }
}
