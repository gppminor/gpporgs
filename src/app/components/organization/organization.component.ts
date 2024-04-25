import { Location } from '@angular/common';
import { Component, OnDestroy, inject } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, combineLatest, map, takeUntil } from 'rxjs';
import { UserService } from 'src/app/services/user.service';
import { Organization } from 'src/app/types/organization';

@Component({
  selector: 'app-details',
  templateUrl: './organization.component.html',
  styleUrl: './organization.component.scss',
})
export class OrganizationComponent implements OnDestroy {
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private location = inject(Location);
  private snackBar = inject(MatSnackBar);
  private route = inject(ActivatedRoute);
  readonly fireService = inject(UserService);

  organization = new Organization();
  formGroup = this.fb.group({});
  address = this.fb.group({});
  contacts = this.fb.group({});
  contactIds: string[];
  isReadOnly = true;

  private organizationId: string | null;
  loading = { organization: true, address: true, contacts: true };

  // For auto-unsubscribe
  private destroy$ = new Subject<void>();

  constructor() {
    this.fetchOrganzation(this.route.snapshot.paramMap.get('id'));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  fetchOrganzation(id: string | null) {
    if (!id || id === this.organizationId) return;
    this.organizationId = id;
    this.fireService
      .getOrganization(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe((_organization) => {
        if (_organization) {
          this.organization = _organization;
          this.initFormControls();
          this.fetchAddress(_organization.address);
          this.fetchContacts(_organization.contacts);
          this.loading.organization = false;
        }
      });
  }

  private fetchAddress(id: string) {
    this.fireService
      .getAddress(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe((_address) => {
        const controls: any = {};
        for (const [key, value] of Object.entries(_address as any)) {
          controls[key] = this.fb.control(value || '-');
        }
        this.formGroup.addControl('address', this.fb.group(controls));
        this.loading.address = false;
      });
  }

  // Fetch contacts in parallel and update the contacts FormGroup
  private fetchContacts(ids: string[]) {
    if (ids.length == 0) this.loading.contacts = false;
    this.contactIds = [];
    const observables = ids.map((id) => {
      this.contactIds.push(id);
      return this.fireService.getContact(id);
    });
    combineLatest(observables)
      .pipe(takeUntil(this.destroy$))
      .pipe(
        map((_contacts) => {
          for (const contact of _contacts) {
            const fg = this.fb.group({});
            for (const [key, val] of Object.entries(contact)) {
              // Skip the id field
              if (key != 'id') fg.addControl(key, this.fb.control(val || '-'));
            }
            this.contacts.addControl(contact['id'], fg);
          }
        })
      )
      .subscribe((_) => (this.loading.contacts = false));
  }

  initFormControls() {
    for (const [key, value] of Object.entries(new Organization())) {
      if (typeof value == 'string') {
        const val = (this.organization as any)[key];
        this.formGroup.addControl(key, this.fb.control(val || '-'));
      }
    }
  }

  goHome() {
    this.router.navigate(['/']);
  }

  actionEdit() {
    this.snackBar.open('editing is not enabled');
  }

  actionReviews() {
    this.router.navigate(['organization', this.organizationId, 'reviews']);
  }
}
