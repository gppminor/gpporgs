import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  inject,
} from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, combineLatest, takeUntil } from 'rxjs';
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

  deletedContacts = new Set<number>();

  // For auto-unsubscribe
  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    const orgId = this.route.snapshot.paramMap.get('id');
    if (this.data) {
      this.initOrgControls(this.data);
      this.fetchAddress(this.data.address);
      this.fetchContacts(this.data.contacts);
      this.loading.organization = false;
    } else if (orgId) {
      this.fetchOrganization(orgId);
    } else {
      this.data = new Organization();
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
      if (!data[i]) {
        this.deletedContacts.add(i);
        continue;
      }
      this.formGroup.controls.contacts.push(this.fb.group({}));
      for (const [key, val] of Object.entries(new Contact())) {
        this.formGroup.controls.contacts.controls[i].addControl(
          key,
          this.fb.control((data[i] as any)[key] || val)
        );
      }
    }
    this.original.contacts = [...data];
    this.loading.contacts.fill(false);
  }

  save() {
    this.saveOrganization();
    this.saveAddress();
    this.saveContacts();
  }

  private async saveOrganization() {
    const update: any = this.formGroup.controls.organization.value;
    this.processing.organization = true;
    this.canSave = false;
    if (this.deletedContacts.size > 0) {
      const contacts = [];
      for (let idx = 0; idx < this.data!.contacts.length; idx++) {
        if (!this.deletedContacts.has(idx))
          contacts.push(this.data!.contacts[idx]);
      }
      update.contacts = contacts;
    }
    if (valueChanged(this.original.organization, update)) {
      await this.adminService.updateOrganization(this.data!.id, update);
      this.original.organization = { ...this.original.organization, ...update };
    }
    this.processing.organization = false;
  }

  private async saveAddress() {
    const update = this.formGroup.controls.address.value;
    this.processing.address = true;
    this.canSave = false;
    if (valueChanged(this.original.address, update)) {
      await this.adminService.updateAddress(this.data!.address, update);
      this.original.address = { ...this.original.address, ...update };
    }
    this.processing.address = false;
  }

  private async saveContacts() {
    const update = this.formGroup.controls.contacts.value;
    this.processing.contacts = true;
    this.canSave = false;
    for (let idx = 0; idx < this.data!.contacts.length; idx++) {
      if (this.deletedContacts.has(idx)) {
        await this.adminService.deleteContact(this.data!.contacts[idx]);
        this.deletedContacts.delete(idx);
        this.data!.contacts.splice(idx);
      } else if (valueChanged(this.original.contacts[idx], update[idx])) {
        await this.adminService.updateContact(
          this.data!.contacts[idx],
          update[idx]
        );
      }
    }
    this.original.contacts = [...update];
    this.processing.contacts = false;
  }

  deleteContact(idx: number) {
    this.formGroup.controls.contacts.removeAt(idx);
    this.loading.contacts.splice(idx, 1);
    this.deletedContacts.add(idx);
    this.canSave = true;
  }
}
