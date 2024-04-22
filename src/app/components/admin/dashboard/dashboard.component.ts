import { Component, inject } from '@angular/core';
import { ADMIN_STATS } from 'src/app/constants';
import { AdminService } from 'src/app/services/admin.service';

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
      key: ADMIN_STATS.KEY_APPROVED,
    },
    {
      label: 'Pending Organizations',
      key: ADMIN_STATS.KEY_PENDING,
    },
    {
      label: 'Total Reviews',
      key: ADMIN_STATS.KEY_REVIEWS,
    },
    {
      label: 'Student Users',
      key: ADMIN_STATS.KEY_STUDENTS,
    },
    {
      label: 'Admin Users',
      key: ADMIN_STATS.KEY_ADMINS,
    },
  ];
}
