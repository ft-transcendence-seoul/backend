import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { User } from 'src/users/user.entity';
import { RedisService } from 'src/commons/redis-client.service';
import { RedisField } from 'src/commons/enums/redis.enum';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly usersService: UsersService,
    private readonly redisService: RedisService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    if (request?.session.userId) {
      const userId = request.session.userId;
      const sessionId = await this.redisService.hget(
        RedisField.USER_TO_SESSION + userId,
        RedisField.SESSION_ID,
      );
      if (sessionId && sessionId === request.sessionID) {
        const user: User = await this.usersService.findById(userId);
        if (!user) {
          throw new UnauthorizedException('유효하지 않은 사용자입니다.');
        }
        request.user = user;
        return true;
      } else {
        throw new UnauthorizedException('소켓이 연결되지 않았습니다.');
      }
    } else {
      throw new UnauthorizedException('로그인이 필요합니다.');
    }
  }
}
