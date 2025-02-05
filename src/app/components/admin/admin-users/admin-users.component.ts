import {
  AfterViewInit,
  Component,
  OnDestroy,
  OnInit,
  ViewChild,
  inject,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Subject, takeUntil } from 'rxjs';
import { AdminService } from 'src/app/services/admin.service';
import { AuthService } from 'src/app/services/auth.service';
import { Action } from 'src/app/types/enums';
import { Role, User } from 'src/app/types/user';
import { formatTime } from 'src/app/utils';
import { ActionUserComponent } from '../action-user/action-user.component';

@Component({
  selector: 'app-admin-users',
  templateUrl: './admin-users.component.html',
  styleUrl: './admin-users.component.scss',
})
export class AdminUsersComponent implements AfterViewInit, OnInit, OnDestroy {
  private dialog = inject(MatDialog);
  private authService = inject(AuthService);
  private adminService = inject(AdminService);

  private uid: string | undefined;
  Role = Role;

  displayCols = [
    'name',
    'email',
    'lastAccessAt',
    'accessCount',
    'role',
    'actions',
  ];

  dataSource = new MatTableDataSource<User>();
  loading$ = this.adminService.loading$;

  @ViewChild(MatSort) sort: MatSort;
  @ViewChild(MatPaginator) paginator: MatPaginator;

  formatTime = formatTime;

  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.authService.user$
      .pipe(takeUntil(this.destroy$))
      .subscribe((user) => (this.uid = user?.uid));

    this.adminService.users$
      .pipe(takeUntil(this.destroy$))
      .subscribe((users) => (this.dataSource.data = users));
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  isSelf = (id: string): boolean => id === this.uid;

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  addUser(): void {
    this.dialog.open(ActionUserComponent, {
      disableClose: true,
      data: { action: Action.ADD },
    });
  }

  editUser(user: User): void {
    this.dialog.open(ActionUserComponent, {
      disableClose: true,
      data: { action: Action.EDIT, user },
    });
  }

  deleteUser(user: User): void {
    this.dialog.open(ActionUserComponent, {
      disableClose: true,
      data: { action: Action.DELETE, user },
    });
  }
}
