import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { SecureShieldModule } from 'src/secure-shield/secure-shield.module';
import { CommonsModule } from 'src/commons/commons.module';

@Module({
  imports: [TypeOrmModule.forFeature([User]), SecureShieldModule, CommonsModule],
  exports: [TypeOrmModule, UsersService],
  providers: [UsersService],
  controllers: [UsersController],
})
export class UsersModule {}
