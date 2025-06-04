import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressBarModule } from '@angular/material/progress-bar';

@Component({
  selector: 'app-futuristic-loader',
  standalone: true,
  imports: [CommonModule, MatProgressBarModule],
  template: `
    <div class="loader-container" [ngClass]="type">
      <div class="pulse-container">
        <div class="pulse-circle"></div>
        <div class="pulse-circle"></div>
        <div class="pulse-circle"></div>
      </div>
      <div class="loader-content">
        <div class="hexagon-container">
          <div class="hexagon"></div>
          <div class="hexagon"></div>
          <div class="hexagon"></div>
        </div>
        <div class="central-icon">
          <svg *ngIf="type === 'medical'" viewBox="0 0 24 24" class="medical-icon">
            <path d="M19 3H5c-1.1 0-1.99.9-1.99 2L3 19c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-1 11h-4v4h-4v-4H6v-4h4V6h4v4h4v4z"/>
          </svg>
          <div *ngIf="type === 'data'" class="data-grid">
            <div class="data-block" *ngFor="let i of [1,2,3,4,5,6,7,8,9]"></div>
          </div>
        </div>
      </div>
      <div class="message" *ngIf="message">{{ message }}</div>
      <div *ngIf="showProgress" class="progress-container">
        <mat-progress-bar mode="determinate" [value]="progress"></mat-progress-bar>
        <div class="progress-text">{{ progress }}%</div>
      </div>
    </div>
  `,
  styles: [`
    .loader-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 30px;
      position: relative;
      width: 300px;
      transition: all 0.3s ease;
    }
    
    .pulse-container {
      position: absolute;
      width: 180px;
      height: 180px;
    }
    
    .pulse-circle {
      position: absolute;
      width: 100%;
      height: 100%;
      border-radius: 50%;
      background-color: rgba(var(--accent-color-rgb), 0.2);
      opacity: 0;
      animation: pulse 3s infinite;
    }
    
    .pulse-circle:nth-child(2) {
      animation-delay: 1s;
    }
    
    .pulse-circle:nth-child(3) {
      animation-delay: 2s;
    }
    
    @keyframes pulse {
      0% {
        transform: scale(0.5);
        opacity: 0;
      }
      50% {
        opacity: 0.4;
      }
      100% {
        transform: scale(1.2);
        opacity: 0;
      }
    }
    
    .loader-content {
      width: 120px;
      height: 120px;
      background-color: var(--background-secondary);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      z-index: 10;
      box-shadow: 0 0 30px rgba(var(--accent-color-rgb), 0.3);
      border: 3px solid rgba(var(--accent-color-rgb), 0.5);
    }
    
    .hexagon-container {
      position: absolute;
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .hexagon {
      position: absolute;
      width: 100%;
      height: 100%;
      background: transparent;
      border: 1px solid rgba(var(--accent-color-rgb), 0.2);
      border-radius: 50%;
      animation: rotate 10s linear infinite;
    }
    
    .hexagon:nth-child(2) {
      width: 80%;
      height: 80%;
      animation-duration: 7s;
      animation-direction: reverse;
    }
    
    .hexagon:nth-child(3) {
      width: 60%;
      height: 60%;
      animation-duration: 5s;
    }
    
    @keyframes rotate {
      0% {
        transform: rotate(0deg);
      }
      100% {
        transform: rotate(360deg);
      }
    }
    
    .central-icon {
      width: 50px;
      height: 50px;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 20;
    }
    
    .medical-icon {
      width: 40px;
      height: 40px;
      fill: var(--accent-color);
      animation: pulse-icon 2s infinite;
    }
    
    @keyframes pulse-icon {
      0% {
        transform: scale(0.9);
        opacity: 0.7;
      }
      50% {
        transform: scale(1.1);
        opacity: 1;
      }
      100% {
        transform: scale(0.9);
        opacity: 0.7;
      }
    }
    
    .data-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      grid-gap: 3px;
      width: 30px;
      height: 30px;
    }
    
    .data-block {
      background-color: var(--accent-color);
      opacity: 0.1;
      animation: data-fade 2s infinite;
    }
    
    .data-block:nth-child(1) { animation-delay: 0.1s; }
    .data-block:nth-child(2) { animation-delay: 0.2s; }
    .data-block:nth-child(3) { animation-delay: 0.3s; }
    .data-block:nth-child(4) { animation-delay: 0.4s; }
    .data-block:nth-child(5) { animation-delay: 0.5s; }
    .data-block:nth-child(6) { animation-delay: 0.6s; }
    .data-block:nth-child(7) { animation-delay: 0.7s; }
    .data-block:nth-child(8) { animation-delay: 0.8s; }
    .data-block:nth-child(9) { animation-delay: 0.9s; }
    
    @keyframes data-fade {
      0%, 100% { opacity: 0.1; }
      50% { opacity: 1; }
    }
    
    .message {
      margin-top: 20px;
      color: var(--text-secondary);
      font-size: 16px;
      text-align: center;
      max-width: 260px;
    }
    
    .progress-container {
      margin-top: 20px;
      width: 100%;
      position: relative;
    }
    
    .progress-text {
      position: absolute;
      top: -20px;
      right: 0;
      font-size: 12px;
      color: var(--text-secondary);
    }
    
    /* Type-specific customizations */
    .medical .loader-content {
      border-color: rgba(76, 175, 80, 0.5);
      box-shadow: 0 0 30px rgba(76, 175, 80, 0.3);
    }
    
    .medical .pulse-circle {
      background-color: rgba(76, 175, 80, 0.2);
    }
    
    .medical .hexagon {
      border-color: rgba(76, 175, 80, 0.2);
    }
    
    .medical .medical-icon {
      fill: #4CAF50;
    }
    
    .data .loader-content {
      border-color: rgba(33, 150, 243, 0.5);
      box-shadow: 0 0 30px rgba(33, 150, 243, 0.3);
    }
    
    .data .pulse-circle {
      background-color: rgba(33, 150, 243, 0.2);
    }
    
    .data .hexagon {
      border-color: rgba(33, 150, 243, 0.2);
    }
    
    .data .data-block {
      background-color: #2196F3;
    }
  `]
})
export class FuturisticLoaderComponent {
  @Input() type: 'medical' | 'data' = 'medical';
  @Input() message: string = '';
  @Input() showProgress: boolean = false;
  @Input() progress: number = 0;
}