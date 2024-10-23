import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Action } from 'src/app/types/enums';
import { Organization } from 'src/app/types/organization';

@Component({
  selector: 'app-action-organization',
  templateUrl: './action-organization.component.html',
  styleUrl: './action-organization.component.scss',
})
export class ActionOrganizationComponent {
  private dialogRef = inject(MatDialogRef<ActionOrganizationComponent>);
  data = inject(MAT_DIALOG_DATA);

  organization: Organization;
  action: Action;

  isDetailView = true;

  constructor() {
    this.organization = this.data.data;
    this.action = this.data.action;
  }

  close() {
    this.dialogRef.close();
  }
}
