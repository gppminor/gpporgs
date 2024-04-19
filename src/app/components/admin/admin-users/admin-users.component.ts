import { Component, ViewChild, inject } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSelectChange } from '@angular/material/select';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Subject, takeUntil } from 'rxjs';
import { Role } from 'src/app/models/user';
import { FirestoreService } from 'src/app/services/firestore.service';
import { formatTime } from 'src/app/utils';

@Component({
  selector: 'app-admin-users',
  templateUrl: './admin-users.component.html',
  styleUrl: './admin-users.component.scss',
})
export class AdminUsersComponent {
  private fireService = inject(FirestoreService);
  Role = Role;

  displayCols = ['name', 'email', 'lastAccessAt', 'loginCount', 'role'];
  dataSource = new MatTableDataSource<any>();
  dataLoading = false;

  @ViewChild(MatSort) sort: MatSort;
  @ViewChild(MatPaginator) paginator: MatPaginator;

  formatTime = formatTime;

  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.dataLoading = true;
    this.fireService
      .getUsers()
      .pipe(takeUntil(this.destroy$))
      .subscribe((users) => {
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
        this.dataSource.data = users;
        this.dataLoading = false;
      });
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
}
