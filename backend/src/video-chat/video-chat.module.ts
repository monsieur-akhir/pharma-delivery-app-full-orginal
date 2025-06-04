import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { VideoChatGateway } from './video-chat.gateway';
import { VideoChatService } from './video-chat.service';
import { VideoChatController } from './video-chat.controller';
import { config } from '../config';

@Module({
  imports: [
    JwtModule.register({
      secret: config.security.jwt.secret,
      signOptions: { expiresIn: config.security.jwt.expiresIn },
    }),
  ],
  providers: [VideoChatGateway, VideoChatService],
  controllers: [VideoChatController],
  exports: [VideoChatService],
})
export class VideoChatModule {}