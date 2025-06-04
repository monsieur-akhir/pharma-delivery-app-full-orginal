import { Injectable, Logger } from '@nestjs/common';

interface OngoingConsultation {
  userId: number;
  pharmacistId: number;
  roomId: string;
  startTime: Date;
}

@Injectable()
export class VideoChatService {
  private logger = new Logger(VideoChatService.name);
  private videoChatHistory = new Map<number, any[]>();
  private availablePharmacists = new Set<number>();
  private ongoingConsultations = new Map<number, OngoingConsultation>();

  /**
   * Logs a video chat session start event
   * @param userId The user who initiated the video chat
   * @param pharmacistId The pharmacist who joined the video chat
   * @param roomId The room ID for the video chat
   */
  async logVideoSessionStart(userId: number, pharmacistId: number, roomId: string): Promise<void> {
    try {
      // Store the ongoing consultation
      this.ongoingConsultations.set(userId, {
        userId,
        pharmacistId,
        roomId,
        startTime: new Date(),
      });
      
      // Remove pharmacist from available list while in consultation
      this.availablePharmacists.delete(pharmacistId);
      
      this.logger.log(`Video chat session started: ${userId} with pharmacist ${pharmacistId} in room ${roomId}`);
    } catch (error) {
      this.logger.error(`Failed to log video session start: ${error.message}`, error.stack);
    }
  }

  /**
   * Logs a video chat session end event
   * @param userId The user who was in the video chat
   * @param pharmacistId The pharmacist who was in the video chat
   * @param roomId The room ID for the video chat
   * @param duration The duration of the video chat in seconds
   */
  async logVideoSessionEnd(
    userId: number, 
    pharmacistId: number, 
    roomId: string, 
    duration: number
  ): Promise<void> {
    try {
      // Store chat session in memory history
      const userHistory = this.videoChatHistory.get(userId) || [];
      userHistory.push({
        id: Date.now(),
        userId,
        pharmacistId,
        roomId,
        duration,
        timestamp: new Date(),
      });
      this.videoChatHistory.set(userId, userHistory);
      
      // Remove from ongoing consultations
      this.ongoingConsultations.delete(userId);
      
      // Make pharmacist available again
      this.availablePharmacists.add(pharmacistId);
      
      this.logger.log(`Video chat session ended: ${userId} with pharmacist ${pharmacistId}, duration: ${duration}s`);
    } catch (error) {
      this.logger.error(`Failed to log video session end: ${error.message}`, error.stack);
    }
  }

  /**
   * Gets the video chat history for a user
   * @param userId The user to get history for
   */
  async getUserVideoChatHistory(userId: number) {
    try {
      // Return in-memory history
      return this.videoChatHistory.get(userId) || [];
    } catch (error) {
      this.logger.error(`Failed to get user video chat history: ${error.message}`, error.stack);
      throw error;
    }
  }
  
  /**
   * Set a pharmacist as available for video consultations
   * @param pharmacistId The ID of the pharmacist
   */
  setPharmacistAvailable(pharmacistId: number): void {
    this.availablePharmacists.add(pharmacistId);
    this.logger.log(`Pharmacist ${pharmacistId} set as available`);
  }
  
  /**
   * Set a pharmacist as unavailable for video consultations
   * @param pharmacistId The ID of the pharmacist
   */
  setPharmacistUnavailable(pharmacistId: number): void {
    this.availablePharmacists.delete(pharmacistId);
    this.logger.log(`Pharmacist ${pharmacistId} set as unavailable`);
  }
  
  /**
   * Get the count of available pharmacists
   * @returns The number of available pharmacists
   */
  getAvailablePharmacistsCount(): number {
    return this.availablePharmacists.size;
  }
  
  /**
   * Get the ongoing consultation for a user if any
   * @param userId User ID
   * @returns The ongoing consultation or null if none
   */
  getUserOngoingConsultation(userId: number): OngoingConsultation | null {
    return this.ongoingConsultations.get(userId) || null;
  }
}