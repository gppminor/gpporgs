import { COMMA, ENTER } from '@angular/cdk/keycodes';
import {
  Component,
  EventEmitter,
  inject,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatChipInputEvent } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import {
  BehaviorSubject,
  map,
  Observable,
  startWith,
  Subject,
  takeUntil,
} from 'rxjs';
import { PRACTICE_DURATIONS } from 'src/app/constants';
import { AdminService } from 'src/app/services/admin.service';
import { AuthService } from 'src/app/services/auth.service';
import { UserService } from 'src/app/services/user.service';
import { Address } from 'src/app/types/address';
import { Action } from 'src/app/types/enums';
import { Review } from 'src/app/types/review';
import { valueChanged } from 'src/app/utils';
import { ConfirmDeleteComponent } from '../../admin/confirm-delete/confirm-delete.component';

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
  private adminService = inject(AdminService);
  private authService = inject(AuthService);
  private dialog = inject(MatDialog);

  @Input() data!: any;
  @Input() action?: Action;
  @Input() isCreating: boolean = false;
  @Output() reviewCreated = new EventEmitter<void>();

  Action = Action;
  formGroup = this.fb.group({});
  loading = false;
  processing = false;
  isReadOnly: boolean = true;
  canSave = false;
  readonly separatorKeysCodes = [ENTER, COMMA] as const;
  private readonly allLangs = Array.from(this.fireService.languages.keys());
  readonly langControl = this.fb.control('');
  filteredLangs: Observable<string[]>;
  private readonly selectedLangs = new BehaviorSubject<string[]>([]);
  selectedLangs$ = this.selectedLangs.asObservable();

  durations = PRACTICE_DURATIONS;

  // For auto-unsubscribe
  private destroy$ = new Subject<void>();
  private original: any = {};

  ngOnInit(): void {
    this.initControls();
    this.fetchAddress();
    this.formGroup.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((value: any) => {
        if (this.loading || this.processing) return;
        if (this.isCreating) {
          // For creating, enable save if form has any meaningful content
          this.canSave =
            this.formGroup.valid &&
            (value.workDone?.trim() ||
              value.typicalDay?.trim() ||
              value.evaluation?.trim() ||
              value.difficulties?.trim() ||
              value.otherComments?.trim() ||
              value.duration?.trim() ||
              (value.address?.street?.trim() && value.address?.city?.trim()));
        } else {
          this.canSave = valueChanged(this.original, value);
        }
      });
    this.filteredLangs = this.langControl.valueChanges.pipe(
      startWith(null),
      map((value: any) => {
        if (typeof value == 'string') return this.filterLang(value);
        return this.allLangs.filter(
          (code) =>
            !this.selectedLangs.value.find((selected) => selected == code)
        );
      })
    );
    this.selectedLangs.next(this.data.languages || []);
    this.isReadOnly =
      !this.router.url.startsWith('/admin/') && !this.isCreating;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  initControls() {
    for (const [key, value] of Object.entries(new Review())) {
      if (key === 'reviewer') {
        // Always create reviewer as a FormGroup with an email control
        const reviewerData =
          this.data[key] && typeof this.data[key] === 'object'
            ? this.data[key]
            : {};
        this.formGroup.addControl(
          key,
          this.fb.group({
            email: this.fb.control(reviewerData.email || ''),
          })
        );
      } else {
        this.formGroup.addControl(
          key,
          this.fb.control(this.data[key] ?? value)
        );
      }
    }
    this.selectedLangs$.pipe(takeUntil(this.destroy$)).subscribe((value) => {
      (this.formGroup.controls as any).languages.setValue(value);
      if (!this.isCreating) {
        this.canSave = valueChanged(this.original, this.formGroup.value);
      }
    });
    this.original = JSON.parse(JSON.stringify(this.data));
  }

  fetchAddress() {
    this.loading = true;

    // If creating a new review, initialize with empty address
    if (this.isCreating || !this.data.address) {
      const controls: any = {};
      for (const [key, value] of Object.entries(new Address())) {
        controls[key] = value;
      }
      this.formGroup.addControl('address', this.fb.group(controls));
      this.original.address = { ...new Address() };
      this.loading = false;
      return;
    }

    // For existing reviews, fetch the address
    this.fireService
      .getAddress(this.data.address)
      .pipe(takeUntil(this.destroy$))
      .subscribe((result) => {
        const controls: any = {};
        for (const [key, value] of Object.entries(new Address())) {
          controls[key] = result[key] || value;
        }
        this.formGroup.addControl('address', this.fb.group(controls));
        this.original.address = { ...result };
        this.loading = false;
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

  getLanguages(): string {
    const langs: string[] = [];
    this.selectedLangs.value.map((code: string) =>
      langs.push(this.fireService.languages.get(code) || '')
    );
    return langs.join(', ');
  }

  addLanguage(event: MatChipInputEvent): void {
    event.chipInput.clear();
  }

  removeLanguage(code: string): void {
    const selected = [...this.selectedLangs.value];
    const idx = selected.indexOf(code);
    if (idx == -1) return;
    selected.splice(idx, 1);
    this.selectedLangs.next(selected);
  }

  selectLanguage(event: MatAutocompleteSelectedEvent) {
    const code = event.option.value;
    if (!this.selectedLangs.value.find((lang) => lang == code)) {
      const selected = this.selectedLangs.value;
      selected.push(code);
      this.selectedLangs.next(selected);
    }
    this.langControl.setValue('');
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

  getReviewerDisplay(): string {
    if (this.isCreating) return this.authService.currentUserEmail || '';
    // If review is anonymous, check if user is admin or if it's their own review
    if (this.data.anonymous) {
      const isAdmin = this.authService.isAdmin;
      const currentUserEmail = this.authService.currentUserEmail;
      const isOwnReview =
        currentUserEmail === this.data.reviewer?.email || this.isCreating;

      // Show "Anonymous" only if user is not admin and it's not their own review
      if (!isAdmin && !isOwnReview) {
        return 'Anonymous';
      }
    }

    // Show actual reviewer email for non-anonymous reviews, admins, or own reviews
    return this.data.reviewer?.email || 'Missing';
  }

  private filterLang(value: string) {
    const filterValue = value.toLowerCase();
    return this.allLangs.filter((code) => {
      const name = this.fireService.languages.get(code);
      if (!name) return false;
      return (
        (name.toLowerCase().includes(filterValue) ||
          code.toLowerCase().includes(filterValue)) &&
        !this.selectedLangs.value.find((selected) => selected == code)
      );
    });
  }

  async deleteReview() {
    const dialogRef = this.dialog.open(ConfirmDeleteComponent, {
      data: {
        title: 'Delete Review',
        message: 'Are you sure you want to delete this review?',
      },
    });
    dialogRef.afterClosed().subscribe(async (result) => {
      console.log(this.data);
      if (!result || !this.data.id) return;
      this.processing = true;
      this.formGroup.disable();
      await Promise.all([
        this.adminService.deleteReview(this.data.id),
        this.adminService.deleteAddress(this.data.address),
      ]);
      this.formGroup.enable();
      this.processing = false;
    });
  }

  async updateReview() {
    if (!this.data.id) return;
    this.processing = true;
    this.formGroup.disable();
    const updated: any = { ...this.formGroup.value };
    const address = { ...updated.address };
    delete updated.address;
    await Promise.all([
      this.adminService.updateReview(this.data.id, updated),
      this.adminService.updateAddress(this.data.address, address),
    ]);
    this.original = { ...updated, address };
    this.formGroup.enable();
    this.canSave = false;
    this.processing = false;
  }

  async createReview() {
    this.processing = true;
    this.formGroup.disable();

    try {
      const reviewData: any = { ...this.formGroup.value };
      const addressData = { ...reviewData.address };
      delete reviewData.address;

      // Get organization ID from route params
      const organizationId = this.route.parent?.snapshot.paramMap.get('id');
      if (!organizationId) {
        throw new Error('Organization ID not found');
      }

      // Get current user email
      const currentUserEmail = this.authService.currentUserEmail;
      if (!currentUserEmail) {
        throw new Error('User not authenticated');
      }

      // Set required fields for new review
      reviewData.organization = organizationId;
      reviewData.reviewer = { email: currentUserEmail };
      reviewData.createdAt = Date.now();

      console.log(addressData);
      console.log(reviewData);

      // Create address first
      const addressId = await this.fireService.addAddress(addressData);
      reviewData.address = addressId;

      // // Create review
      await this.fireService.addReview(reviewData);

      // // Emit success event
      this.reviewCreated.emit();
    } catch (error) {
      console.error('Error creating review:', error);
      // You might want to show a snackbar or error message here
    } finally {
      this.formGroup.enable();
      this.processing = false;
    }
  }
}
