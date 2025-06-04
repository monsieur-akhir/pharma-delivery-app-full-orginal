import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { Chart, ChartConfiguration } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FormBuilder, FormGroup } from '@angular/forms';
import { PrescriptionAnalysisService, PrescriptionTrend, PrescriptionInsight } from '../prescription-analysis.service';
import { forkJoin, catchError, of } from 'rxjs';

@Component({
  selector: 'app-prescription-trends',
  templateUrl: './prescription-trends.component.html',
  styleUrls: ['./prescription-trends.component.scss']
})
export class PrescriptionTrendsComponent implements OnInit {
  @ViewChild('performanceChart') performanceChartRef?: ElementRef;
  @ViewChild('categoryDistributionChart') categoryDistributionChartRef?: ElementRef;
  @ViewChild('trendingMedicationsChart') trendingMedicationsChartRef?: ElementRef;
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(BaseChartDirective) baseChart!: BaseChartDirective;

  // Graphiques
  performanceChartData: ChartConfiguration['data'] = { datasets: [] };
  performanceChartOptions: ChartConfiguration['options'] = {};
  
  categoryDistributionChartData: ChartConfiguration['data'] = { datasets: [] };
  categoryDistributionChartOptions: ChartConfiguration['options'] = {};
  
  trendingMedicationsChartData: ChartConfiguration['data'] = { datasets: [] };
  trendingMedicationsChartOptions: ChartConfiguration['options'] = {};
  
  // Données des tendances
  trendingMedications: PrescriptionTrend[] = [];
  prescriptionInsights: PrescriptionInsight[] = [];
  
  // Filtre de période
  filterForm: FormGroup;
  timeframeOptions = [
    { value: '7d', label: '7 derniers jours' },
    { value: '30d', label: '30 derniers jours' },
    { value: '90d', label: '90 derniers jours' },
    { value: '180d', label: '6 derniers mois' },
    { value: '365d', label: '12 derniers mois' }
  ];
  
  // Tableau pour les anomalies
  anomalyColumns: string[] = ['date', 'prescriptionId', 'medicineName', 'reason', 'confidence', 'actions'];
  anomalyDataSource = new MatTableDataSource<any>([]);
  
  // État de chargement
  isLoading = true;
  error: string | null = null;

  constructor(
    private prescriptionAnalysisService: PrescriptionAnalysisService,
    private snackBar: MatSnackBar,
    private fb: FormBuilder
  ) {
    this.filterForm = this.fb.group({
      timeframe: ['30d']
    });
  }

  ngOnInit(): void {
    this.setupChartOptions();
    this.loadAllData();
    
    // Recharger les données lorsque la période change
    this.filterForm.get('timeframe')?.valueChanges.subscribe(timeframe => {
      this.loadAllData();
    });
  }

  loadAllData(): void {
    this.isLoading = true;
    this.error = null;
    
    const timeframe = this.filterForm.get('timeframe')?.value || '30d';
    
    forkJoin({
      performanceMetrics: this.prescriptionAnalysisService.getPrescriptionAnalysisMetrics(timeframe).pipe(
        catchError(error => {
          console.error('Error loading prescription metrics', error);
          return of(null);
        })
      ),
      categoryDistribution: this.prescriptionAnalysisService.getMedicationCategoryDistribution(timeframe).pipe(
        catchError(error => {
          console.error('Error loading category distribution', error);
          return of(null);
        })
      ),
      trendingMedications: this.prescriptionAnalysisService.getTrendingMedications(timeframe).pipe(
        catchError(error => {
          console.error('Error loading trending medications', error);
          return of(null);
        })
      ),
      prescriptionInsights: this.prescriptionAnalysisService.getPrescriptionInsights(timeframe).pipe(
        catchError(error => {
          console.error('Error loading prescription insights', error);
          return of(null);
        })
      ),
      anomalies: this.prescriptionAnalysisService.getAnomalyDetectionResults(timeframe).pipe(
        catchError(error => {
          console.error('Error loading anomalies', error);
          return of(null);
        })
      )
    }).subscribe(results => {
      this.isLoading = false;
      
      if (!results.performanceMetrics && !results.categoryDistribution && !results.trendingMedications) {
        this.error = 'Impossible de charger les données d\'analyse des prescriptions. Veuillez réessayer.';
        return;
      }
      
      // Mettre à jour les graphiques
      if (results.performanceMetrics) {
        this.updatePerformanceChart(results.performanceMetrics);
      }
      
      if (results.categoryDistribution) {
        this.updateCategoryDistributionChart(results.categoryDistribution);
      }
      
      if (results.trendingMedications) {
        this.trendingMedications = results.trendingMedications;
        this.updateTrendingMedicationsChart(results.trendingMedications);
      }
      
      if (results.prescriptionInsights) {
        this.prescriptionInsights = results.prescriptionInsights;
      }
      
      if (results.anomalies) {
        this.anomalyDataSource.data = results.anomalies.data || [];
      }
      
      // Mettre à jour les graphiques
      if (this.baseChart) {
        this.baseChart.update();
      }
    });
  }

  setupChartOptions(): void {
    // Options pour le graphique de performance
    this.performanceChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          grid: {
            display: false
          }
        },
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Pourcentage'
          }
        }
      },
      plugins: {
        legend: {
          display: true,
          position: 'top'
        },
        title: {
          display: true,
          text: 'Performance de l\'analyse des ordonnances'
        }
      }
    };
    
    // Options pour le graphique de distribution des catégories
    this.categoryDistributionChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'right'
        },
        title: {
          display: true,
          text: 'Distribution des catégories de médicaments'
        }
      }
    };
    
    // Options pour le graphique des médicaments tendance
    this.trendingMedicationsChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: 'y',
      scales: {
        x: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Croissance (%)'
          }
        }
      },
      plugins: {
        legend: {
          display: false
        },
        title: {
          display: true,
          text: 'Médicaments les plus prescrits'
        }
      }
    };
  }

  updatePerformanceChart(data: any): void {
    const chartData = {
      labels: data.labels,
      datasets: [
        {
          label: 'Taux de confiance',
          data: data.confidenceRates,
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 2,
          fill: true
        },
        {
          label: 'Taux de reconnaissance',
          data: data.recognitionRates,
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 2,
          fill: true
        },
        {
          label: 'Taux d\'erreur',
          data: data.errorRates,
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 2,
          fill: true
        }
      ]
    };
    
    this.performanceChartData = chartData;
  }

  updateCategoryDistributionChart(data: any): void {
    const colors = this.generateColors(data.labels.length);
    
    const chartData = {
      labels: data.labels,
      datasets: [
        {
          data: data.data,
          backgroundColor: colors,
          borderWidth: 1
        }
      ]
    };
    
    this.categoryDistributionChartData = chartData;
  }

  updateTrendingMedicationsChart(medications: PrescriptionTrend[]): void {
    const topMeds = medications.slice(0, 10);
    const labels = topMeds.map(med => med.medicineName);
    const growthData = topMeds.map(med => med.growth);
    const colors = topMeds.map(med => {
      switch (med.importance) {
        case 'high': return 'rgba(255, 99, 132, 0.7)';
        case 'medium': return 'rgba(255, 159, 64, 0.7)';
        case 'low': return 'rgba(54, 162, 235, 0.7)';
        default: return 'rgba(75, 192, 192, 0.7)';
      }
    });
    
    const chartData = {
      labels: labels,
      datasets: [
        {
          data: growthData,
          backgroundColor: colors,
          borderWidth: 1
        }
      ]
    };
    
    this.trendingMedicationsChartData = chartData;
  }

  generateColors(count: number): string[] {
    const baseColors = [
      'rgba(255, 99, 132, 0.7)',
      'rgba(54, 162, 235, 0.7)',
      'rgba(255, 206, 86, 0.7)',
      'rgba(75, 192, 192, 0.7)',
      'rgba(153, 102, 255, 0.7)',
      'rgba(255, 159, 64, 0.7)',
      'rgba(199, 199, 199, 0.7)',
      'rgba(83, 102, 255, 0.7)',
      'rgba(40, 159, 64, 0.7)',
      'rgba(210, 99, 132, 0.7)'
    ];
    
    const colors: string[] = [];
    for (let i = 0; i < count; i++) {
      colors.push(baseColors[i % baseColors.length]);
    }
    
    return colors;
  }

  exportData(format: 'csv' | 'json' = 'csv'): void {
    const timeframe = this.filterForm.get('timeframe')?.value || '30d';
    
    this.prescriptionAnalysisService.exportPrescriptionAnalysisData(timeframe, format)
      .subscribe(
        blob => {
          const today = new Date().toISOString().slice(0, 10);
          const fileName = `prescription-analysis_${today}.${format}`;
          
          // Créer un lien de téléchargement
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = fileName;
          document.body.appendChild(a);
          a.click();
          
          // Nettoyer
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
          
          this.snackBar.open(`Données d'analyse des prescriptions exportées avec succès au format ${format.toUpperCase()}.`, 'Fermer', {
            duration: 3000
          });
        },
        error => {
          console.error('Error exporting prescription analysis data', error);
          this.snackBar.open(`Impossible d'exporter les données d'analyse des prescriptions. Veuillez réessayer.`, 'Fermer', {
            duration: 3000
          });
        }
      );
  }

  analyzeSelectedPrescriptions(ids: number[]): void {
    this.prescriptionAnalysisService.analyzeSpecificPrescriptions(ids)
      .subscribe(
        result => {
          this.snackBar.open(`Analyse de ${ids.length} ordonnances lancée avec succès.`, 'Fermer', {
            duration: 3000
          });
        },
        error => {
          console.error('Error analyzing prescriptions', error);
          this.snackBar.open(`Erreur lors de l'analyse des ordonnances sélectionnées.`, 'Fermer', {
            duration: 3000
          });
        }
      );
  }

  refreshData(): void {
    this.loadAllData();
  }

  getPriorityClass(priority: string): string {
    switch (priority) {
      case 'high': return 'priority-high';
      case 'medium': return 'priority-medium';
      case 'low': return 'priority-low';
      default: return '';
    }
  }

  getImportanceClass(importance: string): string {
    switch (importance) {
      case 'high': return 'importance-high';
      case 'medium': return 'importance-medium';
      case 'low': return 'importance-low';
      default: return '';
    }
  }
}