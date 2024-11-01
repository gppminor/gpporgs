import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-confirm-delete',
  templateUrl: './confirm-delete.component.html',
  styleUrl: './confirm-delete.component.scss',
})
export class ConfirmDeleteComponent {
  dialogRef = inject(MatDialogRef<ConfirmDeleteComponent>);
  data: any = inject(MAT_DIALOG_DATA);
}
