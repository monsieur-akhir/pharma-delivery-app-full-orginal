import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ThemeService, ThemeMode } from '../../../core/services/theme.service';

@Component({
  selector: 'app-theme-switcher',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatTooltipModule],
  template: `
    <div class="theme-switcher">
      <button 
        mat-icon-button 
        [matTooltip]="getTooltipText()"
        (click)="toggleTheme()"
        class="theme-toggle-button">
        <mat-icon>{{ getIconName() }}</mat-icon>
      </button>
    </div>
  `,
  styles: [`
    .theme-switcher {
      display: inline-block;
    }
    
    .theme-toggle-button {
      transition: transform 0.3s ease;
    }
    
    .theme-toggle-button:hover {
      transform: rotate(30deg);
    }
  `]
})
export class ThemeSwitcherComponent implements OnInit {
  currentTheme: ThemeMode = 'light';
  
  constructor(private themeService: ThemeService) {}

  ngOnInit(): void {
    this.themeService.currentTheme$.subscribe(theme => {
      this.currentTheme = theme;
    });
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  getIconName(): string {
    switch (this.currentTheme) {
      case 'light':
        return 'wb_sunny';
      case 'dark':
        return 'nights_stay';
      case 'blue':
        return 'water_drop';
      default:
        return 'wb_sunny';
    }
  }

  getTooltipText(): string {
    switch (this.currentTheme) {
      case 'light':
        return 'Basculer vers le mode sombre';
      case 'dark':
        return 'Basculer vers le mode bleu';
      case 'blue':
        return 'Basculer vers le mode clair';
      default:
        return 'Changer de thème';
    }
  }
}