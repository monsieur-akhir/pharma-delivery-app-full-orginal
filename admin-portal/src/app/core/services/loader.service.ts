import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface LoadingState {
  isLoading: boolean;
  message?: string;
  progress?: number;
}

@Injectable({
  providedIn: 'root'
})
export class LoaderService {
  private loadingStateSubject = new BehaviorSubject<LoadingState>({ isLoading: false });
  public loadingState$: Observable<LoadingState> = this.loadingStateSubject.asObservable();

  constructor() { }

  startLoading(message?: string): void {
    this.loadingStateSubject.next({ isLoading: true, message, progress: 0 });
  }

  updateProgress(progress: number): void {
    const currentState = this.loadingStateSubject.value;
    this.loadingStateSubject.next({ ...currentState, progress });
  }

  updateMessage(message: string): void {
    const currentState = this.loadingStateSubject.value;
    this.loadingStateSubject.next({ ...currentState, message });
  }

  stopLoading(): void {
    this.loadingStateSubject.next({ isLoading: false });
  }
}