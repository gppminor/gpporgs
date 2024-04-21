import { Component, inject } from '@angular/core';
import { AdminService } from 'src/app/services/admin.service';
import { Role } from 'src/app/types/user';

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
      observable: this.adminService.countOrganizations(true),
    },
    {
      label: 'Pending Organizations',
      observable: this.adminService.countOrganizations(false),
    },
    {
      label: 'Total Reviews',
      observable: this.adminService.countReviews(),
    },
    {
      label: 'Student Users',
      observable: this.adminService.countUsers(Role.STUDENT),
    },
    {
      label: 'Admin Users',
      observable: this.adminService.countUsers(Role.ADMIN),
    },
  ];
}
