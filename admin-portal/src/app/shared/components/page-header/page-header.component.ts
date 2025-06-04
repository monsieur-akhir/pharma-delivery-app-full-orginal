import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-page-header',
  templateUrl: './page-header.component.html',
  styleUrls: ['./page-header.component.scss'],
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule]
})
export class PageHeaderComponent {
  @Input() title: string = '';
  @Input() subtitle: string = '';
  @Input() showBackButton: boolean = false;
  @Input() actionButtonLabel: string = '';
  @Output() backClick = new EventEmitter<void>();
  @Output() actionClick = new EventEmitter<void>();
  
  onBackClick(): void {
    this.backClick.emit();
  }
  
  onActionClick(): void {
    this.actionClick.emit();
  }
}