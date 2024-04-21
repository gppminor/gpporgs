import { Component, ViewChild, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSelectChange } from '@angular/material/select';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Subject, takeUntil } from 'rxjs';
import { AdminService } from 'src/app/services/admin.service';
import { Action } from 'src/app/types/enums';
import { Role, User } from 'src/app/types/user';
import { formatTime } from 'src/app/utils';
import { AdminActionComponent } from '../admin-action/admin-action.component';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-admin-users',
  templateUrl: './admin-users.component.html',
  styleUrl: './admin-users.component.scss',
})
export class AdminUsersComponent {
  private dialog = inject(MatDialog);
  private authService = inject(AuthService)
  private adminService = inject(AdminService);

  Role = Role;

  displayCols = [
    'name',
    'email',
    'lastAccessAt',
    'loginCount',
    'role',
    'actions',
  ];
  dataSource = new MatTableDataSource<any>();
  dataLoading = false;

  @ViewChild(MatSort) sort: MatSort;
  @ViewChild(MatPaginator) paginator: MatPaginator;

  formatTime = formatTime;

  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.dataLoading = true;
    this.adminService.users$
      .pipe(takeUntil(this.destroy$))
      .subscribe((users) => {
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
        this.dataSource.data = users;
        this.dataLoading = false;
      });
    this.adminService.getUsers();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  onClick(event: MatSelectChange, user: any) {
    console.log(user.role);
  }

  addUser(): void {
    this.dialog.open(AdminActionComponent, {
      disableClose: true,
      data: { action: Action.ADD },
    });
  }

  editUser(user: User): void {
    this.dialog.open(AdminActionComponent, {
      disableClose: true,
      data: { action: Action.EDIT, user },
    });
  }

  deleteUser(user: User): void {
    this.dialog.open(AdminActionComponent, {
      disableClose: true,
      data: { action: Action.DELETE, user },
    });
  }
}
