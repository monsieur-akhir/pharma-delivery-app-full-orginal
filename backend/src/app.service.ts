import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Welcome to MedConnect API - Your medication delivery solution!';
  }
}