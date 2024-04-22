import { Component, ViewChild, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { take } from 'rxjs';
import { AdminService } from 'src/app/services/admin.service';
import { AuthService } from 'src/app/services/auth.service';
import { Action } from 'src/app/types/enums';
import { Role, User } from 'src/app/types/user';
import { formatTime } from 'src/app/utils';
import { AdminActionComponent } from '../admin-action/admin-action.component';

@Component({
  selector: 'app-admin-users',
  templateUrl: './admin-users.component.html',
  styleUrl: './admin-users.component.scss',
})
export class AdminUsersComponent {
  private dialog = inject(MatDialog);
  private authService = inject(AuthService);
  private adminService = inject(AdminService);

  private email: string | null | undefined;
  Role = Role;

  displayCols = [
    'name',
    'email',
    'lastAccessAt',
    'loginCount',
    'role',
    'actions',
  ];

  dataSource = new MatTableDataSource<User>();
  loading = false;

  @ViewChild(MatSort) sort: MatSort;
  @ViewChild(MatPaginator) paginator: MatPaginator;

  formatTime = formatTime;

  ngOnInit(): void {
    this.loading = true;

    this.authService.user$
      .pipe(take(1))
      .subscribe((user) => (this.email = user?.email));

    this.adminService
      .getUsers()
      .pipe(take(1))
      .subscribe((users) => {
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
        this.dataSource.data = users;
        this.loading = false;
      });
  }

  isSelf(user: User): boolean {
    return user.email === this.email;
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  addUser(): void {
    const dialogRef = this.dialog.open(AdminActionComponent, {
      disableClose: true,
      data: { action: Action.ADD },
    });

    dialogRef
      .afterClosed()
      .pipe(take(1))
      .subscribe((user) => {
        if (user) {
          const data = [...this.dataSource.data, user];
          this.dataSource.data = data;
        }
      });
  }

  editUser(user: User): void {
    const dialogRef = this.dialog.open(AdminActionComponent, {
      disableClose: true,
      data: { action: Action.EDIT, user },
    });

    dialogRef
      .afterClosed()
      .pipe(take(1))
      .subscribe((partial) => {
        if (partial) {
          const data = this.dataSource.data.map((user) => {
            if (user.id !== partial.id) return user;
            return { ...user, ...partial };
          });
          this.dataSource.data = data;
        }
      });
  }

  deleteUser(user: User): void {
    const dialogRef = this.dialog.open(AdminActionComponent, {
      disableClose: true,
      data: { action: Action.DELETE, user },
    });

    dialogRef
      .afterClosed()
      .pipe(take(1))
      .subscribe((id) => {
        if (id) {
          this.dataSource.data = this.dataSource.data.filter(
            (user) => user.id !== id
          );
        }
      });
  }
}
