import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { AppService } from './app.service';

@Controller('api') // 'api' prefix'i ekliyoruz
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('test') // GET /api/test
  getTest() {
    return {
      status: 'success',
      message: 'Backend çalışıyor!',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('public') // GET /api/public
  getPublicData() {
    return {
      message: 'Bu genel bir rotadır!',
      timestamp: new Date().toISOString(),
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('protected') // GET /api/protected
  getProtectedData() {
    return {
      message: 'Bu korunan bir rotadır!',
      timestamp: new Date().toISOString(),
    };
  }
}
