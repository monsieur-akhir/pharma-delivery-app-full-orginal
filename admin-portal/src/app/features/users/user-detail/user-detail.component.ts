import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-user-detail',
  template: `
    <div class="container">
      <h2>Détails de l'Utilisateur #{{ userId }}</h2>
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
export class UserDetailComponent implements OnInit {
  userId: string = '';

  constructor(private route: ActivatedRoute) { }

  ngOnInit(): void {
    this.userId = this.route.snapshot.params['id'];
  }
}