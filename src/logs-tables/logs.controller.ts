import { BadRequestException, Controller, Get, Query, Request, UseGuards } from '@nestjs/common';
import { LogsService } from './logs.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { Roles } from 'src/auth/roles.decorator';
import { RolesGuard } from 'src/auth/roles.guard';

@Controller('logs')
export class LogsController {
    constructor(
        private readonly logService: LogsService,
    ) { }

    @UseGuards(JwtAuthGuard,RolesGuard)
    @Roles(2)
    @Get('get-logs')
    async getLogs(
        @Request() req,
        @Query() query: any,
    ) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı kimliği gereklidir');
        }
        return this.logService.getLogs(req.user.userId, query);
    }

}
