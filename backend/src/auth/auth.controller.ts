import { Body, Controller, Post, HttpException, HttpStatus, Logger, UseGuards, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ApiResponse } from '@nestjs/swagger/dist/decorators/api-response.decorator';
import { VerifyOtpDto, RequestPasswordResetDto, ResetPasswordDto, VerifyPasswordResetDto, SendOtpDto } from './dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';



@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  @Post('send-otp')
  async sendOtp(@Body() sendOtpDto: SendOtpDto) {
    try {
      return this.authService.sendOtp({
        identifier: sendOtpDto.identifier,
        channel: sendOtpDto.channel,
      });
    } catch (error) {
      this.logger.error(`Failed to send OTP: ${error.message}`);
      throw new HttpException(
        'Failed to send verification code',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('verify-otp')
  async verifyOtp(@Body() verifyOtpCodeDto: VerifyOtpDto) {
    try {
      return this.authService.verifyOtp(
        verifyOtpCodeDto.identifier,
        verifyOtpCodeDto.otp
      );
    } catch (error) {
      this.logger.error(`Failed to verify OTP: ${error.message}`);
      throw new HttpException(
        error.message || 'Failed to verify code',
        error.status || HttpStatus.UNAUTHORIZED
      );
    }
  }

  @Post('request-password-reset')
  async requestPasswordReset(@Body() dto: RequestPasswordResetDto) {
    try {
      return this.authService.requestPasswordReset(
        dto.identifier,
        dto.channel
      );
    } catch (error) {
      this.logger.error(`Failed to request password reset: ${error.message}`);
      throw new HttpException(
        'Failed to request password reset',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('verify-password-reset')
  async verifyPasswordReset(@Body() dto: VerifyPasswordResetDto) {
    try {
      return this.authService.verifyPasswordReset(
        dto.identifier,
        dto.resetCode,
        dto.newPassword
      );
    } catch (error) {
      this.logger.error(`Failed to verify password reset: ${error.message}`);
      throw new HttpException(
        error.message || 'Failed to reset password',
        error.status || HttpStatus.UNAUTHORIZED
      );
    }
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'User successfully logged out' })
  async logout(@Req() req) {
    try {
      return this.authService.logout(req.user.id);
    } catch (error) {
      this.logger.error(`Failed to logout: ${error.message}`);
      throw new HttpException(
        'Failed to logout',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}