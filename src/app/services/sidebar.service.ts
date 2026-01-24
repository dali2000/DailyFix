import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SidebarService {
  private toggleSidebarSubject = new Subject<void>();
  toggleSidebar$ = this.toggleSidebarSubject.asObservable();

  toggle() {
    this.toggleSidebarSubject.next();
  }
}

