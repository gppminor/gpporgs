import { Component, inject } from '@angular/core';
import {
  AdminService,
  KEY_ADMINS,
  KEY_APPROVED,
  KEY_PENDING,
  KEY_REVIEWS,
  KEY_STUDENTS,
} from 'src/app/services/admin.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent {
  adminService = inject(AdminService);

  statistics = [
    {
      label: 'Approved Organizations',
      key: KEY_APPROVED,
    },
    {
      label: 'Pending Organizations',
      key: KEY_PENDING,
    },
    {
      label: 'Total Reviews',
      key: KEY_REVIEWS,
    },
    {
      label: 'Student Users',
      key: KEY_STUDENTS,
    },
    {
      label: 'Admin Users',
      key: KEY_ADMINS,
    },
  ];
}
