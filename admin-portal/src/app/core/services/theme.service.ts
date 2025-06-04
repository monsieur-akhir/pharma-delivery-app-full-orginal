import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type ThemeMode = 'light' | 'dark' | 'blue';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private themeKey = 'app-theme';
  private currentThemeSubject = new BehaviorSubject<ThemeMode>('light');
  
  public currentTheme$ = this.currentThemeSubject.asObservable();

  constructor() {
    this.loadSavedTheme();
  }

  private loadSavedTheme(): void {
    const savedTheme = localStorage.getItem(this.themeKey) as ThemeMode;
    
    if (savedTheme) {
      this.setTheme(savedTheme);
    } else {
      // Default theme
      this.setTheme('light');
    }
  }

  public setTheme(theme: ThemeMode): void {
    // Remove all theme classes
    document.body.classList.remove('theme-light', 'theme-dark', 'theme-blue');
    
    // Add new theme class
    document.body.classList.add(`theme-${theme}`);
    
    // Save to local storage
    localStorage.setItem(this.themeKey, theme);
    
    // Update the subject
    this.currentThemeSubject.next(theme);
  }

  public toggleTheme(): void {
    const currentTheme = this.currentThemeSubject.value;
    let newTheme: ThemeMode;
    
    switch (currentTheme) {
      case 'light':
        newTheme = 'dark';
        break;
      case 'dark':
        newTheme = 'blue';
        break;
      case 'blue':
        newTheme = 'light';
        break;
      default:
        newTheme = 'light';
    }
    
    this.setTheme(newTheme);
  }
}