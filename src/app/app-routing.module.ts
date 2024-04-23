import { NgModule } from '@angular/core';
import {
  canActivate,
  hasCustomClaim,
  redirectUnauthorizedTo,
} from '@angular/fire/auth-guard';
import { RouterModule, Routes } from '@angular/router';
import { AdminOrganizationsComponent } from './components/admin/admin-organizations/admin-organizations.component';
import { AdminUsersComponent } from './components/admin/admin-users/admin-users.component';
import { AdminComponent } from './components/admin/admin.component';
import { DashboardComponent } from './components/admin/dashboard/dashboard.component';
import { HomeComponent } from './components/home/home.component';
import { LoginComponent } from './components/login/login.component';
import { OrganizationComponent } from './components/organization/organization.component';
import { ReviewsComponent } from './components/reviews/reviews.component';

// custom claims are set in cloud function:setClaims
const adminOnly = () => hasCustomClaim('admin');
const redirectUnauthorizedToLogin = () => redirectUnauthorizedTo(['/login']);

const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent,
  },
  {
    path: '',
    component: HomeComponent,
    ...canActivate(redirectUnauthorizedToLogin),
  },
  {
    path: 'organization/:id',
    component: OrganizationComponent,
    ...canActivate(redirectUnauthorizedToLogin),
  },
  {
    path: 'organization/:id/reviews',
    component: ReviewsComponent,
    ...canActivate(redirectUnauthorizedToLogin),
  },
  {
    path: 'admin',
    component: AdminComponent,
    ...canActivate(adminOnly),
    children: [
      { path: '', component: DashboardComponent },
      { path: 'users', component: AdminUsersComponent },
      { path: 'organizations', component: AdminOrganizationsComponent },
    ],
  },
  { path: '**', redirectTo: '/login' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
