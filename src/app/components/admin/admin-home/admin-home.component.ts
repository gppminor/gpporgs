import { Component, inject } from '@angular/core';
import { AdminService } from 'src/app/services/admin.service';

@Component({
  selector: 'app-admin-home',
  templateUrl: './admin-home.component.html',
  styleUrl: './admin-home.component.scss',
})
export class AdminHomeComponent {
  adminService = inject(AdminService);

  statistics = [
    {
      label: 'Approved Organizations',
      observable: this.adminService.organizationsApproved$,
    },
    {
      label: 'Pending Organizations',
      observable: this.adminService.organizationsPending$,
    },
    {
      label: 'Total Reviews',
      observable: this.adminService.reviewsTotal$,
    },
    {
      label: 'Student Users',
      observable: this.adminService.usersStudent$,
    },
    {
      label: 'Admin Users',
      observable: this.adminService.usersAdmin$,
    },
  ];
}
