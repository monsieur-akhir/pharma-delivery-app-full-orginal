import { Component, OnInit, OnDestroy, Inject, ElementRef, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { VideoChatService } from '../../../core/services/api/video-chat.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { VideoChat } from '../../../shared/models/video-chat.model';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';

// Declare OpenTok on the global window object
declare global {
  interface Window {
    OpenTok: any;
  }
}

@Component({
  selector: 'app-video-chat-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatTooltipModule
  ],
  templateUrl: './video-chat-dialog.component.html',
  styleUrls: ['./video-chat-dialog.component.scss']
})
export class VideoChatDialogComponent implements OnInit, OnDestroy {
  @ViewChild('publisherDiv') publisherDiv!: ElementRef;
  @ViewChild('subscriberDiv') subscriberDiv!: ElementRef;

  session: VideoChat;
  apiKey = ''; // OpenTok API key will be fetched from backend
  sessionId = '';
  token = '';
  
  otSession: any;
  publisher: any;
  subscriber: any;
  
  connectionEstablished = false;
  isConnecting = true;
  error = '';
  
  private tokenSubscription: Subscription | null = null;

  constructor(
    private dialogRef: MatDialogRef<VideoChatDialogComponent>,
    @Inject(MAT_DIALOG_DATA) private data: { session: VideoChat },
    private videoChatService: VideoChatService,
    private snackBar: MatSnackBar
  ) {
    this.session = data.session;
    this.sessionId = data.session.sessionId || '';
  }

  ngOnInit(): void {
    if (!this.sessionId) {
      this.error = 'ID de session non disponible';
      this.isConnecting = false;
      return;
    }
    
    // Get token from backend
    this.tokenSubscription = this.videoChatService.generateToken(this.session.id, 'pharmacist').subscribe(
      (response) => {
        this.token = response.token;
        this.initializeSession();
      },
      (error) => {
        console.error('Error generating token', error);
        this.error = 'Erreur lors de la génération du token';
        this.isConnecting = false;
        this.snackBar.open('Erreur de connexion à la session vidéo', 'Fermer', {
          duration: 5000
        });
      }
    );
  }

  ngOnDestroy(): void {
    if (this.tokenSubscription) {
      this.tokenSubscription.unsubscribe();
    }
    
    this.disconnectSession();
  }  private initializeSession(): void {
    if (!window.hasOwnProperty('OpenTok')) {
      this.error = 'La bibliothèque OpenTok n\'est pas chargée';
      this.isConnecting = false;
      return;
    }
    
    // Create session
    this.otSession = window.OpenTok.initSession(this.apiKey, this.sessionId);
    
    // Connect event handlers
    this.otSession.on('streamCreated', (event: any) => {
      this.subscriber = this.otSession.subscribe(
        event.stream,
        this.subscriberDiv.nativeElement,
        {
          insertMode: 'append',
          width: '100%',
          height: '100%'
        }
      );
    });
    
    this.otSession.on('connectionCreated', () => {
      this.connectionEstablished = true;
      this.isConnecting = false;
    });
    
    this.otSession.on('sessionDisconnected', () => {
      this.connectionEstablished = false;
    });
    
    this.otSession.on('exception', (event: any) => {
      console.error('OpenTok exception', event);
      this.error = 'Erreur de session: ' + event.message;
    });
      // Initialize publisher
    this.publisher = window.OpenTok.initPublisher(
      this.publisherDiv.nativeElement,
      {
        insertMode: 'append',
        width: '100%',
        height: '100%',
        style: { buttonDisplayMode: 'on' }
      },
      (error: any) => {
        if (error) {
          console.error('Publisher error', error);
          this.error = 'Erreur d\'initialisation de la caméra: ' + error.message;
          this.isConnecting = false;
        }
      }
    );
    
    // Connect to the session
    this.otSession.connect(this.token, (error: any) => {
      if (error) {
        console.error('Connection error', error);
        this.error = 'Erreur de connexion: ' + error.message;
        this.isConnecting = false;
      } else {
        this.otSession.publish(this.publisher);
      }
    });
  }

  disconnectSession(): void {
    if (this.otSession) {
      if (this.publisher) {
        this.otSession.unpublish(this.publisher);
        this.publisher = null;
      }
      
      if (this.subscriber) {
        this.otSession.unsubscribe(this.subscriber);
        this.subscriber = null;
      }
      
      this.otSession.disconnect();
    }
  }
  endCall(): void {
    this.disconnectSession();
    
    if (this.session.status === 'in-progress') {
      this.videoChatService.endSession(this.session.id).subscribe(
        () => {
          this.snackBar.open('Appel terminé avec succès', 'Fermer', {
            duration: 3000
          });
          this.dialogRef.close(true);
        },
        (error) => {
          console.error('Error ending session', error);
          this.snackBar.open('L\'appel a été terminé localement, mais une erreur est survenue lors de la mise à jour du statut', 'Fermer', {
            duration: 5000
          });
          this.dialogRef.close(true);
        }
      );
    } else {
      this.dialogRef.close();
    }
  }
  
  toggleAudio(): void {
    if (this.publisher) {
      this.publisher.publishAudio(!this.publisher.stream.hasAudio);
    }
  }
  
  toggleVideo(): void {
    if (this.publisher) {
      this.publisher.publishVideo(!this.publisher.stream.hasVideo);
    }
  }
}
