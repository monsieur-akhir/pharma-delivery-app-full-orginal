import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { VideoChatService } from './video-chat.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('api/video-chat')
export class VideoChatController {
  constructor(private readonly videoChatService: VideoChatService) {}

  /**
   * Get video chat history for a user
   * @param userId User ID
   * @returns Array of video chat history entries
   */
  @UseGuards(JwtAuthGuard)
  @Get('history/user/:userId')
  async getUserVideoChatHistory(@Param('userId') userId: string) {
    const history = await this.videoChatService.getUserVideoChatHistory(+userId);
    return { success: true, data: history };
  }

  /**
   * Log a video chat session start
   * @param data Object containing user ID, pharmacist ID, and room ID
   * @returns Success message
   */
  @UseGuards(JwtAuthGuard)
  @Post('session/start')
  async logVideoSessionStart(
    @Body() data: { userId: number; pharmacistId: number; roomId: string }
  ) {
    await this.videoChatService.logVideoSessionStart(
      data.userId,
      data.pharmacistId,
      data.roomId
    );
    return { success: true };
  }

  /**
   * Log a video chat session end
   * @param data Object containing user ID, pharmacist ID, room ID, and duration
   * @returns Success message
   */
  @UseGuards(JwtAuthGuard)
  @Post('session/end')
  async logVideoSessionEnd(
    @Body() data: { userId: number; pharmacistId: number; roomId: string; duration: number }
  ) {
    await this.videoChatService.logVideoSessionEnd(
      data.userId,
      data.pharmacistId,
      data.roomId,
      data.duration
    );
    return { success: true };
  }

  /**
   * Check if pharmacists are available for consultation
   * @returns Object with count of available pharmacists
   */
  @Get('pharmacists/available')
  async getAvailablePharmacists() {
    const availableCount = this.videoChatService.getAvailablePharmacistsCount();
    return { 
      success: true, 
      availableCount,
      isAvailable: availableCount > 0
    };
  }

  /**
   * Check if user has an ongoing consultation
   * @returns Object indicating if there's an ongoing consultation
   */
  @UseGuards(JwtAuthGuard)
  @Get('ongoing-consultation')
  async getOngoingConsultation(@Request() req) {
    const userId = req.user.id;
    const ongoingConsultation = this.videoChatService.getUserOngoingConsultation(userId);
    
    return { 
      success: true, 
      hasOngoing: !!ongoingConsultation,
      roomId: ongoingConsultation?.roomId
    };
  }
}