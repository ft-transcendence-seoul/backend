import { Module } from '@nestjs/common';
import { RedisService } from './redis-client.service';
import { MainGateway } from './main.gateway';

@Module({
  providers: [RedisService, MainGateway],
  exports: [RedisService, MainGateway],
})
export class CommonsModule {}
