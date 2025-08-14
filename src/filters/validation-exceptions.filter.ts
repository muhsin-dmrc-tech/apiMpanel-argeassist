import { ExceptionFilter, Catch, ArgumentsHost, BadRequestException, HttpStatus } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Response } from 'express';
import { LogsService } from 'src/logs-tables/logs.service';

@Catch(BadRequestException) // Sadece DTO doğrulama hatalarını yakala
export class ValidationExceptionFilter implements ExceptionFilter {
    constructor(
        private readonly logsService: LogsService,
        private readonly jwtService: JwtService,
    ) { }

    private getUserId(request: any): number | null {
        // Önce request.user'dan kontrol et
        if (request.user && request.user.userId) {
            return request.user.userId;
        }

        // Eğer request.user yoksa JWT token'dan almaya çalış
        try {
            const token = request.headers.authorization?.split(' ')[1];
            if (!token) return null;

            const decoded = this.jwtService.verify(token);
            return decoded?.userId || null;
        } catch (error) {
            return null;
        }
    }


    async catch(exception: BadRequestException, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest();

        // Exception mesajını al
        const exceptionResponse = exception.getResponse() as any;
        const validationErrors = exceptionResponse.message || 'Validation failed';

        const userId = this.getUserId(request);
        let message = exceptionResponse.message || 'Validation failed';
        let errorType = exception.name || 'UnknownError';



        // Log kaydını güncelle
        const logData = {
            logType: 'system',
            eventType: errorType,
            logLevel: 'error',
            message: message,
            source: request.url || errorType,
            ipAddress: request.ip || errorType,
            userAgent: request.headers['user-agent'] || errorType,
            requestUrl: request.originalUrl || errorType,
            userId: userId ? Number(userId) : null, // userId'yi number'a çevir
            relatedEntity: request.route?.path,
            status: 'failed',
            creationTime: new Date(),
            creatorUserId: userId ? Number(userId) : null, // creatorUserId'yi de number'a çevir
            relatedEntityId: null,
            lastModificationTime: null,
            lastModifierUserId: null,
            deletionTime: null,
            deleterUserId: null,
            isDeleted: false
        };
        await this.logsService.logError(logData);


        response.status(HttpStatus.BAD_REQUEST).json({
            statusCode: HttpStatus.BAD_REQUEST,
            timestamp: new Date().toISOString(),
            path: request.url,
            message: validationErrors,
        });
    }
}
