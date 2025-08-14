import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err:any, user:any, info:any) {
    if (err || !user) {
      return null; // Token yoksa user null olur ama hata vermez
    }
    return user;
  }
}
