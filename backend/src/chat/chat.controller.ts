import { Controller, Get, Post, Body, Param, HttpException, HttpStatus, UseGuards } from '@nestjs/common';
import { ChatService } from './chat.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { InsertMessage } from '../../../shared/schema';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('messages')
  async createMessage(@Body() createMessageDto: CreateMessageDto) {
    try {
      // Validate that either receiverId or orderId is provided
      if (!createMessageDto.receiverId && !createMessageDto.orderId) {
        throw new HttpException(
          'Either receiverId or orderId must be provided',
          HttpStatus.BAD_REQUEST,
        );
      }

      const messageData: InsertMessage = {
        sender_id: createMessageDto.senderId,
        content: createMessageDto.content,
        is_read: false,
        created_at: new Date(),
        ...(createMessageDto.receiverId && { receiver_id: createMessageDto.receiverId }),
        ...(createMessageDto.orderId && { order_id: createMessageDto.orderId }),
        ...(createMessageDto.attachmentUrl && { attachment_url: createMessageDto.attachmentUrl }),
      };

      return await this.chatService.createMessage(messageData);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Failed to create message: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('user/:userId')
  async getUserMessages(@Param('userId') userId: string) {
    try {
      return await this.chatService.getUserMessages(+userId);
    } catch (error) {
      throw new HttpException(
        `Failed to retrieve user messages: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('conversation/:userId1/:userId2')
  async getConversation(
    @Param('userId1') userId1: string,
    @Param('userId2') userId2: string,
  ) {
    try {
      return await this.chatService.getConversation(+userId1, +userId2);
    } catch (error) {
      throw new HttpException(
        `Failed to retrieve conversation: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('order/:orderId')
  async getOrderMessages(@Param('orderId') orderId: string) {
    try {
      return await this.chatService.getOrderMessages(+orderId);
    } catch (error) {
      throw new HttpException(
        `Failed to retrieve order messages: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('message/:messageId')
  async getMessageWithDetails(@Param('messageId') messageId: string) {
    try {
      const message = await this.chatService.getMessageWithDetails(+messageId);
      if (!message) {
        throw new HttpException('Message not found', HttpStatus.NOT_FOUND);
      }
      return message;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Failed to retrieve message details: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('message/:messageId/read')
  async markMessageAsRead(@Param('messageId') messageId: string) {
    try {
      return await this.chatService.markMessageAsRead(+messageId);
    } catch (error) {
      throw new HttpException(
        `Failed to mark message as read: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('unread-count/:userId')
  async getUnreadMessageCount(@Param('userId') userId: string) {
    try {
      const count = await this.chatService.getUnreadMessageCount(+userId);
      return { count };
    } catch (error) {
      throw new HttpException(
        `Failed to retrieve unread message count: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}