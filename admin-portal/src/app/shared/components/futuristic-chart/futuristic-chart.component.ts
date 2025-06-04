import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

interface LegendItem {
  color: string;
  label: string;
}

@Component({
  selector: 'app-futuristic-chart',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="futuristic-chart-container" [ngClass]="themeClass">
      <div class="chart-header" *ngIf="title">
        <h3 class="chart-title">{{ title }}</h3>
        <div class="chart-subtitle" *ngIf="subtitle">{{ subtitle }}</div>
      </div>
      
      <div class="chart-wrapper" [style.height.px]="height">
        <!-- Futuristic Chart Visualization -->
        <div class="futuristic-visualization">
          <!-- Graph lines -->
          <div class="graph-lines">
            <svg viewBox="0 0 500 200" preserveAspectRatio="none">
              <!-- Animated Line 1 -->
              <path class="graph-line line-1" 
                d="M0,150 C50,100 100,180 150,120 C200,60 250,140 300,100 C350,60 400,140 450,80 C480,40 490,20 500,0" />
              
              <!-- Animated Line 2 -->
              <path class="graph-line line-2" 
                d="M0,180 C50,160 100,140 150,150 C200,160 250,120 300,130 C350,140 400,100 450,110 C480,120 490,130 500,120" />
              
              <!-- Data Points -->
              <circle class="data-point" cx="50" cy="100" r="4"></circle>
              <circle class="data-point" cx="150" cy="120" r="4"></circle>
              <circle class="data-point" cx="250" cy="140" r="4"></circle>
              <circle class="data-point" cx="350" cy="60" r="4"></circle>
              <circle class="data-point" cx="450" cy="80" r="4"></circle>
            </svg>
          </div>
          
          <!-- Grid lines -->
          <div class="grid-lines">
            <div class="horizontal-line" *ngFor="let i of [1,2,3,4,5]"></div>
            <div class="vertical-line" *ngFor="let i of [1,2,3,4,5]"></div>
          </div>
        </div>
        
        <!-- Holographic effect overlay -->
        <div class="holographic-overlay"></div>
        
        <!-- Scanning effect -->
        <div class="scanning-effect" *ngIf="enableScanEffect">
          <div class="scan-line"></div>
        </div>

        <!-- Medical data visualization -->
        <div class="medical-data" *ngIf="theme === 'medical'">
          <div class="pulse-animation"></div>
          <div class="dna-helix">
            <div class="strand" *ngFor="let i of [1,2,3,4,5]"></div>
          </div>
        </div>
      </div>
      
      <div class="chart-legend" *ngIf="showLegend">
        <div class="legend-item" *ngFor="let item of legendItems">
          <div class="legend-color" [ngStyle]="{'background-color': item.color}"></div>
          <div class="legend-label">{{ item.label }}</div>
        </div>
      </div>

      <!-- Medical data stats -->
      <div class="medical-stats" *ngIf="theme === 'medical'">
        <div class="stat-item">
          <div class="stat-value">98.7<span class="unit">%</span></div>
          <div class="stat-label">Précision</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">87<span class="unit">bpm</span></div>
          <div class="stat-label">Fréquence cardiaque</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">116/78</div>
          <div class="stat-label">Tension artérielle</div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .futuristic-chart-container {
      background: rgba(18, 18, 24, 0.8);
      border-radius: 12px;
      padding: 16px;
      box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
      position: relative;
      overflow: hidden;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }
    
    .futuristic-chart-container::before {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(135deg, rgba(33, 150, 243, 0.05) 0%, transparent 50%);
      z-index: 0;
      pointer-events: none;
    }
    
    .chart-header {
      margin-bottom: 16px;
      position: relative;
      z-index: 2;
    }
    
    .chart-title {
      font-size: 18px;
      color: #E0E0E0;
      margin: 0 0 4px;
      font-weight: 500;
    }
    
    .chart-subtitle {
      font-size: 12px;
      color: #9E9E9E;
    }
    
    .chart-wrapper {
      position: relative;
      margin-bottom: 16px;
      height: 200px;
      z-index: 1;
    }
    
    .futuristic-visualization {
      width: 100%;
      height: 100%;
      position: relative;
    }
    
    .graph-lines {
      width: 100%;
      height: 100%;
      position: absolute;
      top: 0;
      left: 0;
    }
    
    .graph-line {
      fill: none;
      stroke-width: 2px;
      stroke-linecap: round;
    }
    
    .line-1 {
      stroke: #4FC3F7;
      stroke-dasharray: 500;
      stroke-dashoffset: 500;
      animation: dash 3s forwards, glow 2s infinite alternate;
    }
    
    .line-2 {
      stroke: #81C784;
      opacity: 0.6;
      stroke-dasharray: 500;
      stroke-dashoffset: 500;
      animation: dash 3s forwards, glow 2s infinite alternate 0.5s;
    }
    
    @keyframes dash {
      to {
        stroke-dashoffset: 0;
      }
    }
    
    @keyframes glow {
      from {
        filter: drop-shadow(0 0 2px rgba(79, 195, 247, 0.2));
      }
      to {
        filter: drop-shadow(0 0 6px rgba(79, 195, 247, 0.8));
      }
    }
    
    .data-point {
      fill: #4FC3F7;
      filter: drop-shadow(0 0 6px rgba(79, 195, 247, 0.6));
      opacity: 0;
      animation: fadeIn 0.5s forwards 2s;
    }
    
    @keyframes fadeIn {
      to {
        opacity: 1;
      }
    }
    
    .grid-lines {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
    }
    
    .horizontal-line, .vertical-line {
      position: absolute;
      background: rgba(255, 255, 255, 0.05);
    }
    
    .horizontal-line {
      width: 100%;
      height: 1px;
    }
    
    .horizontal-line:nth-child(1) { top: 20%; }
    .horizontal-line:nth-child(2) { top: 40%; }
    .horizontal-line:nth-child(3) { top: 60%; }
    .horizontal-line:nth-child(4) { top: 80%; }
    .horizontal-line:nth-child(5) { top: 100%; }
    
    .vertical-line {
      height: 100%;
      width: 1px;
    }
    
    .vertical-line:nth-child(1) { left: 20%; }
    .vertical-line:nth-child(2) { left: 40%; }
    .vertical-line:nth-child(3) { left: 60%; }
    .vertical-line:nth-child(4) { left: 80%; }
    .vertical-line:nth-child(5) { left: 100%; }
    
    .chart-legend {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      position: relative;
      z-index: 2;
    }
    
    .legend-item {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    
    .legend-color {
      width: 12px;
      height: 12px;
      border-radius: 3px;
    }
    
    .legend-label {
      font-size: 12px;
      color: #BDBDBD;
    }
    
    /* Holographic effect */
    .holographic-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(45deg, 
                  rgba(255, 255, 255, 0) 0%, 
                  rgba(255, 255, 255, 0.03) 50%, 
                  rgba(255, 255, 255, 0) 100%);
      pointer-events: none;
      z-index: 10;
    }
    
    /* Scanning effect */
    .scanning-effect {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      overflow: hidden;
      pointer-events: none;
      z-index: 15;
    }
    
    .scan-line {
      position: absolute;
      width: 100%;
      height: 2px;
      background: linear-gradient(to right, 
                 rgba(33, 150, 243, 0) 0%, 
                 rgba(33, 150, 243, 0.5) 50%, 
                 rgba(33, 150, 243, 0) 100%);
      box-shadow: 0 0 8px rgba(33, 150, 243, 0.8);
      top: 0;
      animation: scan 3s cubic-bezier(0.645, 0.045, 0.355, 1) infinite;
    }
    
    @keyframes scan {
      0% {
        top: -10px;
      }
      100% {
        top: 100%;
      }
    }
    
    /* Medical data visualization */
    .medical-data {
      position: absolute;
      top: 10px;
      right: 10px;
      width: 80px;
      height: 80px;
      z-index: 20;
    }
    
    .pulse-animation {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: rgba(0, 188, 212, 0.2);
      animation: pulse 2s infinite;
    }
    
    @keyframes pulse {
      0% {
        box-shadow: 0 0 0 0 rgba(0, 188, 212, 0.4);
      }
      70% {
        box-shadow: 0 0 0 10px rgba(0, 188, 212, 0);
      }
      100% {
        box-shadow: 0 0 0 0 rgba(0, 188, 212, 0);
      }
    }
    
    .dna-helix {
      position: absolute;
      bottom: 0;
      left: 0;
      width: 40px;
      height: 80px;
    }
    
    .strand {
      position: absolute;
      width: 20px;
      height: 4px;
      border-radius: 2px;
      background: rgba(0, 188, 212, 0.8);
      animation: rotate 3s infinite ease-in-out;
    }
    
    .strand:nth-child(1) { top: 10%; animation-delay: 0s; }
    .strand:nth-child(2) { top: 30%; animation-delay: 0.2s; left: 20px; }
    .strand:nth-child(3) { top: 50%; animation-delay: 0.4s; }
    .strand:nth-child(4) { top: 70%; animation-delay: 0.6s; left: 20px; }
    .strand:nth-child(5) { top: 90%; animation-delay: 0.8s; }
    
    @keyframes rotate {
      0%, 100% { transform: scaleX(1); }
      50% { transform: scaleX(0.5); }
    }
    
    /* Medical stats */
    .medical-stats {
      display: flex;
      justify-content: space-around;
      margin-top: 15px;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      padding-top: 15px;
    }
    
    .stat-item {
      text-align: center;
    }
    
    .stat-value {
      font-size: 24px;
      font-weight: 700;
      color: #4FC3F7;
      margin-bottom: 5px;
    }
    
    .unit {
      font-size: 14px;
      font-weight: 400;
      margin-left: 2px;
    }
    
    .stat-label {
      font-size: 12px;
      color: #9E9E9E;
    }
    
    /* Themes */
    .theme-medical {
      border-color: rgba(0, 188, 212, 0.2);
    }
    
    .theme-medical::before {
      background: linear-gradient(135deg, rgba(0, 188, 212, 0.05) 0%, transparent 50%);
    }
    
    .theme-medical .scan-line {
      background: linear-gradient(to right, 
                 rgba(0, 188, 212, 0) 0%, 
                 rgba(0, 188, 212, 0.5) 50%, 
                 rgba(0, 188, 212, 0) 100%);
      box-shadow: 0 0 8px rgba(0, 188, 212, 0.8);
    }
    
    .theme-medical .line-1 {
      stroke: #00BCD4;
    }
    
    .theme-medical .line-2 {
      stroke: #80DEEA;
    }
    
    .theme-medical .data-point {
      fill: #00BCD4;
    }
    
    .theme-pharmacy {
      border-color: rgba(0, 200, 83, 0.2);
    }
    
    .theme-pharmacy::before {
      background: linear-gradient(135deg, rgba(0, 200, 83, 0.05) 0%, transparent 50%);
    }
    
    .theme-pharmacy .scan-line {
      background: linear-gradient(to right, 
                 rgba(0, 200, 83, 0) 0%, 
                 rgba(0, 200, 83, 0.5) 50%, 
                 rgba(0, 200, 83, 0) 100%);
      box-shadow: 0 0 8px rgba(0, 200, 83, 0.8);
    }
    
    .theme-pharmacy .line-1 {
      stroke: #4CAF50;
    }
    
    .theme-pharmacy .line-2 {
      stroke: #81C784;
    }
    
    .theme-pharmacy .data-point {
      fill: #4CAF50;
    }
    
    .theme-analytics {
      border-color: rgba(103, 58, 183, 0.2);
    }
    
    .theme-analytics::before {
      background: linear-gradient(135deg, rgba(103, 58, 183, 0.05) 0%, transparent 50%);
    }
    
    .theme-analytics .scan-line {
      background: linear-gradient(to right, 
                 rgba(103, 58, 183, 0) 0%, 
                 rgba(103, 58, 183, 0.5) 50%, 
                 rgba(103, 58, 183, 0) 100%);
      box-shadow: 0 0 8px rgba(103, 58, 183, 0.8);
    }
    
    .theme-analytics .line-1 {
      stroke: #673AB7;
    }
    
    .theme-analytics .line-2 {
      stroke: #9575CD;
    }
    
    .theme-analytics .data-point {
      fill: #673AB7;
    }
  `]
})
export class FuturisticChartComponent implements OnInit {
  @Input() title?: string;
  @Input() subtitle?: string;
  @Input() height = 300;
  @Input() showLegend = true;
  @Input() enableScanEffect = true;
  @Input() theme: 'default' | 'medical' | 'pharmacy' | 'analytics' = 'default';
  
  legendItems: LegendItem[] = [
    { color: '#4FC3F7', label: 'Données primaires' },
    { color: '#81C784', label: 'Données secondaires' }
  ];
  
  get themeClass(): string {
    return `theme-${this.theme}`;
  }
  
  ngOnInit(): void {
    // Update legend items based on theme
    if (this.theme === 'medical') {
      this.legendItems = [
        { color: '#00BCD4', label: 'Tension artérielle' },
        { color: '#80DEEA', label: 'Fréquence cardiaque' }
      ];
    } else if (this.theme === 'pharmacy') {
      this.legendItems = [
        { color: '#4CAF50', label: 'Stock disponible' },
        { color: '#81C784', label: 'Commandes' }
      ];
    } else if (this.theme === 'analytics') {
      this.legendItems = [
        { color: '#673AB7', label: 'Visites' },
        { color: '#9575CD', label: 'Conversions' }
      ];
    }
  }
}