import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  UnauthorizedException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { LogsService } from '../logs-tables/logs.service';
import { JwtService } from '@nestjs/jwt';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(
    private readonly logsService: LogsService,
    private readonly jwtService: JwtService,
  ) { }

  private getUserId(request: any): number | null {
    if (request.user && request.user.userId) {
      return request.user.userId;
    }
    try {
      const token = request.headers.authorization?.split(' ')[1];
      if (!token) return null;

      const decoded = this.jwtService.verify(token);
      return decoded?.userId || null;
    } catch (error) {
      return null;
    }
  }

  async catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const userId = this.getUserId(request);
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errorType = 'UnknownError';
    let logType = 'system'; // Varsayılan olarak system log
    let logLevel = 'error'; // Varsayılan olarak error

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse() as any;
      message = exceptionResponse.message || exception.message;
      errorType = exception.name;

      // **Hata Türüne Göre logType ve logLevel Ayarı**
      if (exception instanceof BadRequestException) {
        logType = 'system'; // Validation hataları
        logLevel = 'warning'; // Daha az kritik
      } else if (exception instanceof UnauthorizedException || exception instanceof ForbiddenException) {
        logType = 'security'; // Yetki hataları
        logLevel = 'critical'; // Kritik
      } else {
        logType = 'system'; // Diğer hatalar
        logLevel = 'error'; // Varsayılan olarak error
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      errorType = exception.name;
    }

    if (typeof message !== 'string') {
      message = JSON.stringify(message);
    }
    console.log(message)
    // **Log Kaydını Güncelle**
    const logData = {
      logType: logType, // security ya da system olarak işlenecek
      eventType: errorType,
      logLevel: logLevel, // Burada dinamik logLevel kullanıyoruz
      message: message,
      source: request.url || errorType,
      ipAddress: request.ip || errorType,
      userAgent: request.headers['user-agent'] || errorType,
      requestUrl: request.originalUrl || errorType,
      userId: userId ? Number(userId) : null,
      relatedEntity: request.route?.path,
      status: 'failed',
      creationTime: new Date(),
      creatorUserId: userId ? Number(userId) : null,
      relatedEntityId: null,
      lastModificationTime: new Date(),
      lastModifierUserId: null,
      deletionTime: null,
      deleterUserId: null,
      isDeleted: false
    };
    await this.logsService.logError(logData);

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: message,
      KullaniciID: userId
    });
  }
}
