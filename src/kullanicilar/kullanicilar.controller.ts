import { BadRequestException, Controller, Get, Param, Query, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { Roles } from 'src/auth/roles.decorator';
import { RolesGuard } from 'src/auth/roles.guard';
import { KullanicilarService } from './kullanicilar.service';

@Controller('users')
export class KullanicilarController {
  constructor(
    private readonly kullaniciService: KullanicilarService,
  ) { }

 

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(2)
  @Get('get-users')
  async getUsers(
    @Request() req,
    @Query() query: any,
  ) {
    if (!req.user.userId) {
      throw new BadRequestException('Kullanıcı kimliği gereklidir');
    }
    return this.kullaniciService.getUsers(req.user.userId, query);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(2)
  @Get('get-users-logins')
  async getUsersLogins(
    @Request() req,
    @Query() query: any,
  ) {
    if (!req.user.userId) {
      throw new BadRequestException('Kullanıcı kimliği gereklidir');
    }
    return this.kullaniciService.getUsersLogins(req.user.userId, query);
  }

}
