import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CreateReviewButtonService {
  private showButtonSubject = new BehaviorSubject<boolean>(false);
  private createClickSubject = new Subject<void>();

  showButton$ = this.showButtonSubject.asObservable();
  createClick$ = this.createClickSubject.asObservable();

  setButtonVisibility(show: boolean) {
    this.showButtonSubject.next(show);
  }

  triggerCreateClick() {
    this.createClickSubject.next();
  }
}
