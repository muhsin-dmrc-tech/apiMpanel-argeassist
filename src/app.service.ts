import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getTest() {
    return {
      status: 'success',
      message: 'Backend çalışıyor!',
      timestamp: new Date().toISOString(),
    };
  }
}
