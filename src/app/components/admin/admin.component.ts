import { Component } from '@angular/core';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss'],
})
export class AdminComponent {
  actions: any[] = [
    { label: 'Users', route: 'admin/users' },
    { label: 'Organizations', route: 'admin/organizations' },
  ];
}
