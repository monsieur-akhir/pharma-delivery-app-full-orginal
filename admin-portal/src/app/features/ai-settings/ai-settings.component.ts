import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSelectModule } from '@angular/material/select';
import { ReactiveFormsModule, FormGroup, FormBuilder } from '@angular/forms';

@Component({
  selector: 'app-ai-settings',
  template: `
    <div class="ai-settings-container">
      <h1>Paramètres IA</h1>
      
      <mat-card class="settings-card">
        <mat-card-header>
          <mat-card-title>Configuration de l'IA</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <form [formGroup]="aiSettingsForm" class="settings-form">
            <mat-form-field appearance="fill">
              <mat-label>Modèle d'IA</mat-label>
              <mat-select formControlName="aiModel">
                <mat-option value="gpt-4o">GPT-4o (Recommandé)</mat-option>
                <mat-option value="gpt-4">GPT-4</mat-option>
                <mat-option value="gpt-3.5-turbo">GPT-3.5 Turbo</mat-option>
              </mat-select>
            </mat-form-field>
            
            <mat-form-field appearance="fill">
              <mat-label>Précision de l'OCR</mat-label>
              <mat-select formControlName="ocrPrecision">
                <mat-option value="high">Élevée</mat-option>
                <mat-option value="medium">Moyenne</mat-option>
                <mat-option value="low">Basse</mat-option>
              </mat-select>
            </mat-form-field>
            
            <mat-slide-toggle formControlName="enableAi">
              Activer l'IA pour l'analyse des prescriptions
            </mat-slide-toggle>
            
            <mat-slide-toggle formControlName="enableLogging">
              Activer les journaux détaillés de l'IA
            </mat-slide-toggle>
            
            <button mat-raised-button color="primary" type="submit">
              Enregistrer les modifications
            </button>
          </form>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .ai-settings-container {
      padding: 20px;
    }
    
    .settings-card {
      max-width: 800px;
      margin-top: 20px;
    }
    
    .settings-form {
      display: flex;
      flex-direction: column;
      gap: 20px;
      padding: 16px;
    }
    
    button {
      align-self: flex-start;
      margin-top: 20px;
    }
  `],
  standalone: true,
  imports: [
    CommonModule, 
    MatCardModule, 
    MatFormFieldModule, 
    MatInputModule, 
    MatButtonModule, 
    MatSlideToggleModule, 
    MatSelectModule,
    ReactiveFormsModule
  ]
})
export class AiSettingsComponent implements OnInit {
  aiSettingsForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.aiSettingsForm = this.fb.group({
      aiModel: ['gpt-4o'],
      ocrPrecision: ['high'],
      enableAi: [true],
      enableLogging: [false]
    });
  }

  ngOnInit(): void {
    // Simuler le chargement de données depuis l'API
  }
}