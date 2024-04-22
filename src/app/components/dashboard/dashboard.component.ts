import {
  AfterViewInit,
  Component,
  OnDestroy,
  OnInit,
  ViewChild,
  inject,
} from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatMenuTrigger } from '@angular/material/menu';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { UserService } from 'src/app/services/user.service';
import { Area } from 'src/app/types/enums';
import { Filter } from 'src/app/types/filter';
import { Organization } from 'src/app/types/organization';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  private router = inject(Router);
  private fb = inject(FormBuilder);
  readonly userService = inject(UserService);

  displayCols = ['name', 'type', 'country', 'sectors'];
  dataSource = new MatTableDataSource<Organization>();

  @ViewChild(MatSort) sort: MatSort;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatMenuTrigger) trigger: MatMenuTrigger;

  areas = [Area.DOMESTIC, Area.INTERNATIONAL];
  sectors = <any>[];

  nameControl = this.fb.control('');
  areaControls: FormGroup;
  sectorControls: FormGroup;
  filterValues = new Filter();

  isAllSectorsChecked = true;
  loading = false;

  // For auto-unsubscribe
  private destroy$ = new Subject<void>();

  constructor() {
    this.userService.ready$
      .pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        if (value) {
          this.initFilterControls();
        }
      });
  }

  ngOnInit(): void {
    this.loading = true;
    this.userService.organizations$
      .pipe(takeUntil(this.destroy$))
      .subscribe((orgs) => {
        this.dataSource.data = orgs;
        this.loading = false;
      });
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    this.dataSource.filterPredicate = this.applyFilter;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  initFilterControls() {
    const _areaControls: any = {};
    for (const area of this.areas) {
      _areaControls[area] = true;
      this.filterValues.areas.push(area);
    }
    this.areaControls = this.fb.group(_areaControls);
    const _sectorControls: any = {};
    for (const [key, value] of this.userService.sectors.entries()) {
      _sectorControls[key] = true;
      this.sectors.push({ key, value });
      this.filterValues.sectors.push(key);
    }
    this.sectorControls = this.fb.group(_sectorControls);
    this.registerSubscriptions();
  }

  updateAllSectorsChecked() {
    for (const key in Object.keys(this.sectorControls.controls)) {
      if (!this.sectorControls.get(key)?.value) {
        this.isAllSectorsChecked = false;
        return;
      }
    }
    this.isAllSectorsChecked = true;
  }

  someSectorsChecked(): boolean {
    const values = Object.values(this.sectorControls.value);
    let count = values.length;
    for (const val of values) {
      if (val) count--;
    }
    return count > 0 && count < values.length;
  }

  setAllSectors(value: boolean): void {
    const update: any = {};
    Object.keys(this.sectorControls.controls).map(
      (key) => (update[key] = value)
    );
    this.sectorControls.reset(update);
  }

  registerSubscriptions() {
    this.nameControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((name) => {
        if (name) {
          this.filterValues.name = name.trim().toLowerCase();
          this.dataSource.filter = JSON.stringify(this.filterValues);
        }
      });

    this.areaControls.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((event) => {
        const _areas: string[] = [];
        Object.keys(event).forEach((key) => {
          if (event[key]) _areas.push(key);
        });
        this.filterValues.areas = _areas;
        this.dataSource.filter = JSON.stringify(this.filterValues);
      });

    this.sectorControls.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((event) => {
        const _sectors: string[] = [];
        Object.keys(event).forEach((key) => {
          if (event[key]) _sectors.push(key);
        });
        this.filterValues.sectors = _sectors;
        this.dataSource.filter = JSON.stringify(this.filterValues);
        this.updateAllSectorsChecked();
      });
  }

  applyFilter(org: any, filter: string) {
    try {
      const _filter = JSON.parse(filter);
      const _nameMatch = org.name.trim().toLowerCase().includes(_filter.name);
      const _areaMatch =
        !org.country ||
        (_filter.areas.includes(Area.DOMESTIC) && org.country == 'US') ||
        (_filter.areas.includes(Area.INTERNATIONAL) && org.country != 'US');
      const _sectors = new Set(org.sectors);
      const _sectorsMatch =
        org.sectors.length == 0 ||
        [...new Set(_filter.sectors)].filter((sec) => _sectors.has(sec))
          .length > 0;

      return _nameMatch && _areaMatch && _sectorsMatch;
    } catch (e) {
      return true; // fail safe
    }
  }

  formatSectors(sectorIds: string[], other: string): string {
    return sectorIds
      .map((id) => {
        const value = this.userService.sectors.get(id);
        if (value?.toLowerCase().includes('other')) return other;
        return value;
      })
      .join('\n');
  }

  onClickOrganization(id: string) {
    this.router.navigate(['organization', id]);
  }
}
