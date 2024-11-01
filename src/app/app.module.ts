import { NgModule } from '@angular/core';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { getFunctions, provideFunctions } from '@angular/fire/functions';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatSliderModule } from '@angular/material/slider';
import {
  MAT_SNACK_BAR_DEFAULT_OPTIONS,
  MatSnackBarModule,
} from '@angular/material/snack-bar';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatToolbarModule } from '@angular/material/toolbar';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { environment } from 'src/environments/environment';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ActionOrganizationComponent } from './components/admin/action-organization/action-organization.component';
import { ActionUserComponent } from './components/admin/action-user/action-user.component';
import { AdminOrganizationsComponent } from './components/admin/admin-organizations/admin-organizations.component';
import { AdminUsersComponent } from './components/admin/admin-users/admin-users.component';
import { AdminComponent } from './components/admin/admin.component';
import { DashboardComponent } from './components/admin/dashboard/dashboard.component';
import { DeleteComponent } from './components/delete/delete.component';
import { HomeComponent } from './components/home/home.component';
import { LoginComponent } from './components/login/login.component';
import { DetailComponent } from './components/organization/detail/detail.component';
import { OrganizationComponent } from './components/organization/organization.component';
import { ReviewComponent } from './components/organization/review/review.component';
import { ReviewsComponent } from './components/organization/reviews/reviews.component';
import { ToolbarComponent } from './components/toolbar/toolbar.component';
import { ConfirmDeleteComponent } from './components/admin/confirm-delete/confirm-delete.component';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    AdminComponent,
    ToolbarComponent,
    ReviewComponent,
    ReviewsComponent,
    HomeComponent,
    OrganizationComponent,
    AdminUsersComponent,
    AdminOrganizationsComponent,
    DashboardComponent,
    ActionUserComponent,
    DeleteComponent,
    DetailComponent,
    ActionOrganizationComponent,
    ConfirmDeleteComponent,
  ],
  imports: [
    FormsModule,
    MatListModule,
    MatMenuModule,
    MatSortModule,
    MatIconModule,
    MatCardModule,
    BrowserModule,
    MatChipsModule,
    MatInputModule,
    MatTableModule,
    MatSliderModule,
    MatButtonModule,
    MatSelectModule,
    MatDialogModule,
    MatDividerModule,
    AppRoutingModule,
    MatToolbarModule,
    MatSidenavModule,
    MatCheckboxModule,
    MatSnackBarModule,
    MatGridListModule,
    MatExpansionModule,
    MatFormFieldModule,
    MatPaginatorModule,
    MatAutocompleteModule,
    ReactiveFormsModule,
    MatProgressBarModule,
    BrowserAnimationsModule,
    MatProgressSpinnerModule,
    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore()),
    provideFunctions(() => getFunctions()),
    provideFirebaseApp(() => initializeApp(environment.firebaseConfig)),
  ],
  providers: [
    { provide: MAT_SNACK_BAR_DEFAULT_OPTIONS, useValue: { duration: 2000 } },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
