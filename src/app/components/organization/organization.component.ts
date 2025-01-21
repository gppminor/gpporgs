import {
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
import { Subject, combineLatest, takeUntil } from 'rxjs';
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
})
export class OrganizationComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  readonly fireService = inject(UserService);
  private readonly adminService = inject(AdminService);

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
    const orgId = this.route.snapshot.paramMap.get('id');
    if (orgId) {
      this.fetchOrganization(orgId);
    } else if (this.data) {
      this.initOrgControls(this.data);
      this.fetchAddress(this.data.address);
      this.fetchContacts(this.data.contacts);
      this.loading.organization = false;
    } else {
      this.data = new Organization();
      this.original = { organization: { ...this.data } };
      this.original.address = new Address();
      this.original.contacts = [];
      this.initOrgControls(this.original.organization);
      this.initAddressControls(this.original.address);
      this.loading.organization = false;
      this.loading.address = false;
    }

    this.isReadOnly = !this.router.url.startsWith('/admin');

    this.formGroup.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        const isLoading =
          this.loading.organization ||
          this.loading.address ||
          this.loading.contacts.includes(true);
        if (isLoading) return;
        this.canSave = valueChanged(
          this.original,
          JSON.parse(JSON.stringify(value))
        );
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  fetchOrganization(id: string) {
    this.fireService
      .getOrganization(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe((organization) => {
        if (organization) {
          this.data = organization;
          this.original.organization = { ...organization };
          this.fetchAddress(organization.address);
          this.fetchContacts(organization.contacts);
        } else {
          this.data = new Organization();
        }
        this.initOrgControls(this.data!);
      });
  }

  private fetchAddress(id: string) {
    this.fireService
      .getAddress(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe((address) => this.initAddressControls(address));
  }

  // Fetch contacts in parallel and update the contacts FormGroup
  private fetchContacts(ids: string[]) {
    if (ids.length === 0) {
      this.initContactControls([]);
      return;
    }
    this.loading.contacts = new Array(ids.length).fill(true);
    const observables = ids.map((id) => this.fireService.getContact(id));
    combineLatest(observables)
      .pipe(takeUntil(this.destroy$))
      .subscribe((contacts) => this.initContactControls(contacts));
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
  }

  deleteContact(idx: number) {
    this.formGroup.controls.contacts.removeAt(idx);
    this.loading.contacts.splice(idx, 1);
    this.canSave = true;
  }
}
