import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  inject,
} from '@angular/core';
import { FormArray, FormBuilder, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, combineLatest, takeUntil, distinctUntilChanged, map } from 'rxjs';
import { MAX_NUM_ORG_CONTACTS } from 'src/app/constants';
import { AdminService } from 'src/app/services/admin.service';
import { UserService } from 'src/app/services/user.service';
import { Address } from 'src/app/types/address';
import { Contact } from 'src/app/types/contact';
import { Action } from 'src/app/types/enums';
import { Organization } from 'src/app/types/organization';
import { valueChanged } from 'src/app/utils';

@Component({
  selector: 'app-organization',
  templateUrl: './organization.component.html',
  styleUrl: './organization.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrganizationComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  readonly fireService = inject(UserService);
  private readonly adminService = inject(AdminService);
  private cdr = inject(ChangeDetectorRef);

  @Input() data?: Organization;
  @Input() action?: Action;
  @Output() close: EventEmitter<void> = new EventEmitter();

  Action = Action;
  formGroup = this.fb.group({
    organization: this.fb.group({}),
    address: this.fb.group({}),
    contacts: this.fb.array<FormGroup>([]),
  });
  isReadOnly = true;

  // original values
  private original: any = {};
  canSave = false;

  loading = {
    organization: true,
    address: true,
    contacts: new Array<boolean>(),
  };
  processing = {
    organization: false,
    address: false,
    contacts: false,
  };

  deletedContacts = new Set<string>();

  // For auto-unsubscribe
  private destroy$ = new Subject<void>();

  MAX_CONTACTS = MAX_NUM_ORG_CONTACTS;

  ngOnInit(): void {
    // Monitor route params for changes to avoid unnecessary fetches
    this.route.paramMap.pipe(
      takeUntil(this.destroy$),
      map(params => params.get('id')),
      distinctUntilChanged()
    ).subscribe(orgId => {
      if (orgId) {
        this.fetchOrganization(orgId);
      } else if (this.data) {
        this.initData(this.data);
      } else {
        this.initData(new Organization());
      }
    });

    this.isReadOnly = !this.router.url.startsWith('/admin');
    this.cdr.markForCheck(); // Initial check

    // Optimized valueChanges subscription
    this.formGroup.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        const isLoading =
          this.loading.organization ||
          this.loading.address ||
          this.loading.contacts.includes(true);
        
        if (isLoading) return;
        
        const previousCanSave = this.canSave;
        this.canSave = valueChanged(
          this.original,
          JSON.parse(JSON.stringify(value))
        );
        
        if (previousCanSave !== this.canSave) {
          this.cdr.markForCheck(); // Only trigger change detection when canSave changes
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initData(org: Organization) {
    this.data = org;
    this.original = {
      organization: { ...org },
      address: new Address(),
      contacts: [],
    };
    this.initOrgControls(org);
    if (org.address) {
      this.fetchAddress(org.address);
    } else {
      this.initAddressControls(new Address());
    }
    if (org.contacts?.length) {
      this.fetchContacts(org.contacts);
    } else {
      this.initContactControls([]);
    }
    this.loading.organization = false;
    this.cdr.markForCheck();
  }

  fetchOrganization(id: string) {
    // Prevent refetching if the organization data is already loaded
    if (this.data && this.data.id === id) return;

    this.loading.organization = true;
    this.cdr.markForCheck();

    this.fireService
      .getOrganization(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe((organization) => {
        if (organization) {
          this.initData(organization);
        } else {
          this.initData(new Organization()); // Handle case where organization is not found
        }
      });
  }

  private fetchAddress(id: string) {
    this.loading.address = true;
    this.cdr.markForCheck();
    
    this.fireService
      .getAddress(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (address) => {
          this.initAddressControls(address);
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Error fetching address:', error);
          this.loading.address = false;
          this.cdr.markForCheck();
        }
      });
  }

  // Fetch contacts in parallel and update the contacts FormGroup
  private fetchContacts(ids: string[]) {
    if (ids.length === 0) {
      this.initContactControls([]);
      return;
    }
    this.loading.contacts = new Array(ids.length).fill(true);
    this.cdr.markForCheck();
    
    const observables = ids.map((id) => this.fireService.getContact(id));
    combineLatest(observables)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (contacts) => {
          this.initContactControls(contacts);
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Error fetching contacts:', error);
          this.loading.contacts.fill(false);
          this.cdr.markForCheck();
        }
      });
  }

  getType() {
    if (this.data?.type) return this.fireService.types.get(this.data.type);
    return this.data?.otherType;
  }

  contacts() {
    return this.formGroup.get('contacts') as FormArray;
  }

  initOrgControls(data: Organization) {
    for (const [key, value] of Object.entries(new Organization())) {
      if (typeof value == 'string' || typeof value == 'boolean') {
        const val = (this.data as any)[key];
        this.formGroup.controls.organization.addControl(
          key,
          this.fb.control(val)
        );
      }
    }
    this.original.organization = { ...data };
    this.loading.organization = false;
  }

  initAddressControls(data: Address) {
    for (const [key, val] of Object.entries(new Address())) {
      this.formGroup.controls.address.addControl(
        key,
        this.fb.control((data as any)[key] || val)
      );
    }
    this.original.address = { ...data };
    this.loading.address = false;
  }

  initContactControls(data: Contact[]) {
    for (let i = 0; i < data.length; i++) {
      if (!data[i]) continue;
      this.addContactControl(data[i]);
    }
    this.original.contacts = [...data];
    this.loading.contacts.fill(false);
  }

  private addContactControl(data: any) {
    const fg = this.fb.group({});
    for (const [key, val] of Object.entries(new Contact())) {
      fg.addControl(key, this.fb.control(data[key] || val));
    }
    this.formGroup.controls.contacts.push(fg);
  }

  async save() {
    const update = this.formGroup.controls.organization.value;
    await this.saveAddress(update);
    await this.saveContacts(update);
    await this.saveOrganization(update);
  }

  private async saveOrganization(data: any) {
    this.processing.organization = true;
    this.canSave = false;
    if (valueChanged(this.original.organization, data)) {
      let id = this.data!.id;
      if (id) {
        await this.adminService.updateOrganization(id, data);
      } else {
        data.createdAt = Date.now();
        id = await this.adminService.addOrganization(data);
      }
      this.original.organization = { ...this.original.organization, ...data };
    }
    this.processing.organization = false;
  }

  private async saveAddress(org: any) {
    const update: any = this.formGroup.controls.address.value;
    this.processing.address = true;
    this.canSave = false;
    if (valueChanged(this.original.address, update)) {
      let id = this.data!.address;
      if (id) await this.adminService.updateAddress(id, update);
      else id = await this.adminService.addAddress(update);
      org.address = id;
      org.country = update.country;
      this.original.address = { ...this.original.address, ...update };
    }
    this.processing.address = false;
  }

  private async saveContacts(org: any) {
    const update = this.formGroup.controls.contacts.value;
    this.processing.contacts = true;
    this.canSave = false;
    org.contacts = [];
    for (const contact of this.contacts().value) {
      let id = contact.id;
      if (id) {
        delete contact.id;
        await this.adminService.updateContact(id, contact);
        org.contacts.push(id);
      } else {
        id = await this.adminService.addContact(contact);
        org.contacts.push(id);
      }
    }
    // handle deleted contacts
    for (const contact of this.data?.contacts || []) {
      if (!org.contacts.includes(contact))
        await this.adminService.deleteContact(contact);
    }
    this.original.contacts = [...update];
    this.processing.contacts = false;
  }

  addContact($event: Event) {
    $event.preventDefault();
    this.loading.contacts.push(false);
    this.addContactControl(new Contact());
    this.canSave = true;
    this.cdr.markForCheck();
  }

  deleteContact(idx: number) {
    this.formGroup.controls.contacts.removeAt(idx);
    this.loading.contacts.splice(idx, 1);
    this.canSave = true;
    this.cdr.markForCheck();
  }
}
