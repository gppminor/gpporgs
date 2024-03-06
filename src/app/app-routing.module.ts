import { NgModule } from '@angular/core';
import {
  canActivate,
  hasCustomClaim,
  redirectUnauthorizedTo,
} from '@angular/fire/auth-guard';
import { RouterModule, Routes } from '@angular/router';
import { AdminComponent } from './components/admin/admin.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { LoginComponent } from './components/login/login.component';
import { OrganizationComponent } from './components/organization/organization.component';
import { ReviewsComponent } from './components/reviews/reviews.component';

const redirectUnauthorizedToLogin = () => redirectUnauthorizedTo(['/']);
const adminOnly = () => hasCustomClaim('admin'); // set in cloud function

const routes: Routes = [
  {
    path: '',
    component: LoginComponent,
  },
  {
    path: 'dashboard',
    component: DashboardComponent,
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
  },
  { path: '**', redirectTo: '' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
