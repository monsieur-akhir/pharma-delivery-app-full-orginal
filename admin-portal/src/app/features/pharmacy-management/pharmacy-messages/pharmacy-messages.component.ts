import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ImageViewerComponent } from './image-viewer/image-viewer.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  receiverId: string;
  receiverName: string;
  content: string;
  attachments: MessageAttachment[];
  read: boolean;
  createdAt: string;
}

interface MessageAttachment {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  url: string;
  thumbnailUrl?: string;
}

@Component({
  selector: 'app-pharmacy-messages',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatTooltipModule
  ],
  templateUrl: './pharmacy-messages.component.html',
  styleUrls: ['./pharmacy-messages.component.scss']
})
export class PharmacyMessagesComponent implements OnInit {
  messages: Message[] = [];
  isLoading = true;
  selectedPharmacyId: string | null = null;
  pharmacies: any[] = [];

  constructor(
    private http: HttpClient,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    this.loadPharmacies();
  }

  loadPharmacies(): void {
    this.http.get<any>(`${environment.apiUrl}/v1/api/pharmacies`).subscribe(
      (response) => {
        this.pharmacies = response.items || [];
      },
      (error) => {
        console.error('Error loading pharmacies', error);
        this.snackBar.open('Erreur lors du chargement des pharmacies', 'Fermer', {
          duration: 5000
        });
      }
    );
  }

  onPharmacyChange(): void {
    if (this.selectedPharmacyId) {
      this.loadMessages(this.selectedPharmacyId);
    } else {
      this.messages = [];
    }
  }

  loadMessages(pharmacyId: string): void {
    this.isLoading = true;
    this.http.get<Message[]>(`${environment.apiUrl}/v1/api/messages/pharmacy/${pharmacyId}`).subscribe(
      (messages) => {
        this.messages = messages;
        this.isLoading = false;
      },
      (error) => {
        console.error('Error loading messages', error);
        this.snackBar.open('Erreur lors du chargement des messages', 'Fermer', {
          duration: 5000
        });
        this.isLoading = false;
      }
    );
  }

  viewImage(attachment: MessageAttachment): void {
    this.dialog.open(ImageViewerComponent, {
      data: { imageUrl: attachment.url, title: attachment.fileName },
      panelClass: 'image-viewer-dialog'
    });
  }

  downloadFile(attachment: MessageAttachment): void {
    // Create a hidden link and trigger download
    const link = document.createElement('a');
    link.href = attachment.url;
    link.download = attachment.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  isImage(attachment: MessageAttachment): boolean {
    return attachment.fileType.startsWith('image/');
  }

  getFileIcon(fileType: string): string {
    if (fileType.startsWith('image/')) {
      return 'image';
    } else if (fileType.startsWith('video/')) {
      return 'video_file';
    } else if (fileType.startsWith('audio/')) {
      return 'audio_file';
    } else if (fileType.includes('pdf')) {
      return 'picture_as_pdf';
    } else if (fileType.includes('word') || fileType.includes('document')) {
      return 'description';
    } else if (fileType.includes('excel') || fileType.includes('sheet')) {
      return 'table_chart';
    } else {
      return 'insert_drive_file';
    }
  }

  getFileSize(size: number): string {
    if (size < 1024) {
      return `${size} B`;
    } else if (size < 1024 * 1024) {
      return `${(size / 1024).toFixed(1)} KB`;
    } else {
      return `${(size / (1024 * 1024)).toFixed(1)} MB`;
    }
  }
}
