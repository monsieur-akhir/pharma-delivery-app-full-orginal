import { Component, OnInit, OnDestroy } from '@angular/core';
import { VideoChatService } from '../../core/services/api/video-chat.service';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { VideoChat } from '../../shared/models/video-chat.model';
import { VideoChatDialogComponent } from './video-chat-dialog/video-chat-dialog.component';
import { Subscription, interval } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-video-chat',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatTooltipModule
  ],
  templateUrl: './video-chat.component.html',
  styleUrls: ['./video-chat.component.scss']
})
export class VideoChatComponent implements OnInit, OnDestroy {
  videoSessions: VideoChat[] = [];
  displayedColumns: string[] = ['id', 'patientName', 'pharmacyName', 'status', 'scheduledTime', 'duration', 'actions'];
  isLoading = true;
  refreshInterval: Subscription | null = null;

  constructor(
    private videoChatService: VideoChatService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    this.loadVideoSessions();
    
    // Refresh data every 30 seconds to see updates
    this.refreshInterval = interval(30000).pipe(
      switchMap(() => this.videoChatService.getAllSessions())
    ).subscribe(
      (sessions) => {
        this.videoSessions = sessions;
      }
    );
  }

  ngOnDestroy(): void {
    if (this.refreshInterval) {
      this.refreshInterval.unsubscribe();
    }
  }

  loadVideoSessions(): void {
    this.isLoading = true;
    this.videoChatService.getAllSessions().subscribe(
      (sessions) => {
        this.videoSessions = sessions;
        this.isLoading = false;
      },
      (error) => {
        console.error('Error loading video sessions', error);
        this.snackBar.open('Erreur lors du chargement des sessions vidéo', 'Fermer', {
          duration: 5000
        });
        this.isLoading = false;
      }
    );
  }

  openVideoChat(session: VideoChat): void {
    const dialogRef = this.dialog.open(VideoChatDialogComponent, {
      width: '80%',
      height: '80%',
      data: { session }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadVideoSessions();
      }
    });
  }

  endSession(id: string): void {
    if (confirm('Voulez-vous vraiment terminer cette session vidéo?')) {
      this.videoChatService.endSession(id).subscribe(
        () => {
          this.snackBar.open('Session vidéo terminée avec succès', 'Fermer', {
            duration: 3000
          });
          this.loadVideoSessions();
        },
        (error) => {
          console.error('Error ending video session', error);
          this.snackBar.open('Erreur lors de la terminaison de la session vidéo', 'Fermer', {
            duration: 5000
          });
        }
      );
    }
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'SCHEDULED':
        return 'status-scheduled';
      case 'IN_PROGRESS':
        return 'status-in-progress';
      case 'COMPLETED':
        return 'status-completed';
      case 'CANCELLED':
        return 'status-cancelled';
      default:
        return '';
    }
  }
}
