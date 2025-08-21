import { BadRequestException, Body, Controller, Post, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { BordroHesaplamaService } from './bordro-hesaplama.service';
import { HesaplamaDataDto } from './dto/hesaplamaData.dto';

@Controller('bordro-hesaplama')
export class BordroHesaplamaController {
    constructor(
        private readonly bordrohesaplamaService: BordroHesaplamaService,
    ) { }

    @UseGuards(JwtAuthGuard)
    @Post('hesapla-api')
    async bordroHesapla(@Request() req, @Body() data: HesaplamaDataDto,) {
        if (!req.user.userId) {
            throw new BadRequestException('Kullanıcı ID gereklidir');
        }
        return this.bordrohesaplamaService.bordroHesapla(req.user.userId, data);
    }

}
