import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { Component, inject, Input, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatChipInputEvent } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import {
  BehaviorSubject,
  map,
  Observable,
  startWith,
  Subject,
  takeUntil,
} from 'rxjs';
import { AdminService } from 'src/app/services/admin.service';
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
  private adminService = inject(AdminService);
  private dialog = inject(MatDialog);

  @Input() data!: any;
  @Input() action?: Action;

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

  // For auto-unsubscribe
  private destroy$ = new Subject<void>();
  private original: any = {};

  ngOnInit(): void {
    this.initControls();
    this.fetchAddress();
    this.formGroup.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        if (this.loading || this.processing) return;
        this.canSave = valueChanged(this.original, value);
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
    this.isReadOnly = !this.router.url.startsWith('/admin/');
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  initControls() {
    for (const [key, value] of Object.entries(new Review())) {
      this.formGroup.addControl(key, this.fb.control(this.data[key] || value));
    }
    this.selectedLangs$.pipe(takeUntil(this.destroy$)).subscribe((value) => {
      (this.formGroup.controls as any).languages.setValue(value);
      this.canSave = valueChanged(this.original, this.formGroup.value);
    });
    this.original = JSON.parse(JSON.stringify(this.data));
  }

  fetchAddress() {
    this.loading = true;
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
}
