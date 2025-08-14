import { BadRequestException, Body, Controller, Get, Param, Post, Query, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { EmailTemplatesService } from './email-templates.service';
import { CreateTemplatesDto } from './dto/create.templates.dto';
import { UpdateTemplatesDto } from './dto/update.templates.dto';
import { Roles } from 'src/auth/roles.decorator';
import { RolesGuard } from 'src/auth/roles.guard';

@Controller('email-templates')
export class EmailTemplatesController {
    constructor(
        private readonly emailTemplatesService: EmailTemplatesService,
    ) { }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(2)
    @Get('get-email-template-item/:id')
    async getEmailTemplate(
        @Request() req,
        @Param('id') emailTemplateID: number
    ) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı ID gereklidir');
        }

        if (!emailTemplateID) {
            throw new BadRequestException('EmailTemplate ID gereklidir');
        }

        return this.emailTemplatesService.getEmailTemplate(req.user.userId, emailTemplateID);
    }


    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(2)
    @Get('get-email-templates')
    async getTemplates(
        @Request() req,
        @Query() query: any,
    ) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı ID gereklidir');
        }
        return this.emailTemplatesService.getTemplates(req.user.userId, query);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(2)
    @Post('is-active-update')
    async isActiveUpdate(@Request() req, @Body() data: any,) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı ID gereklidir');
        }
        return this.emailTemplatesService.isActiveUpdate(req.user.userId, data);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(2)
    @Post('delete')
    async delete(@Request() req, @Body() data: any,) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı ID gereklidir');
        }
        return this.emailTemplatesService.delete(req.user.userId, data);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(2)
    @Post('reload')
    async reload(@Request() req, @Body() data: any,) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı ID gereklidir');
        }
        return this.emailTemplatesService.reload(req.user.userId, data);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(2)
    @Post('create')
    async create(@Body() data: CreateTemplatesDto, @Request() req) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı ID gereklidir');
        }
        return this.emailTemplatesService.create(req.user.userId, data);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(2)
    @Post('update')
    async update(@Request() req, @Body() data: UpdateTemplatesDto,) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı ID gereklidir');
        }
        return this.emailTemplatesService.update(req.user.userId, data);
    }
}
