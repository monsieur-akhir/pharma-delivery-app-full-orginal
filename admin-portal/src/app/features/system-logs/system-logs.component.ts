import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-system-logs',
  template: `
    <div class="container">
      <h2>Logs du Système</h2>
      <p>Cette fonctionnalité sera disponible prochainement.</p>
    </div>
  `,
  styles: [`
    .container {
      padding: 20px;
    }
  `],
  standalone: true,
  imports: [CommonModule]
})
export class SystemLogsComponent implements OnInit {
  constructor() { }

  ngOnInit(): void {
  }
}