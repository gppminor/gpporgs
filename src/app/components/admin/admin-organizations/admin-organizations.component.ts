import {
  AfterViewInit,
  Component,
  inject,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { AdminService } from 'src/app/services/admin.service';
import { UserService } from 'src/app/services/user.service';
import { Action } from 'src/app/types/enums';
import { Organization } from 'src/app/types/organization';
import { ActionOrganizationComponent } from '../action-organization/action-organization.component';

@Component({
  selector: 'app-admin-organizations',
  templateUrl: './admin-organizations.component.html',
  styleUrl: './admin-organizations.component.scss',
})
export class AdminOrganizationsComponent
  implements AfterViewInit, OnInit, OnDestroy
{
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private adminService = inject(AdminService);
  readonly userService = inject(UserService);

  displayCols = ['name', 'type', 'country', 'approved', 'actions'];
  dataSource = new MatTableDataSource<Organization>();
  loading$ = this.adminService.loading$;

  @ViewChild(MatSort) sort: MatSort;
  @ViewChild(MatPaginator) paginator: MatPaginator;

  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.adminService.organizations$
      .pipe(takeUntil(this.destroy$))
      .subscribe((organizations) => (this.dataSource.data = organizations));
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  addOrganization() {}

  editOrganization(data: any) {
    this.dialog.open(ActionOrganizationComponent, {
      disableClose: true,
      data: { data, action: Action.EDIT },
    });
  }

  deleteOrganization(id: string) {}
}
