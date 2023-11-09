import { Module } from '@nestjs/common';
import { ChannelsController } from './channels.controller';
import { ChannelsService } from './channels.service';
import { UsersModule } from 'src/users/users.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Channel } from './entities/channel.entity';
import { ChannelRelation } from './entities/channel-relation.entity';

@Module({
  imports: [UsersModule, TypeOrmModule.forFeature([Channel, ChannelRelation])],
  controllers: [ChannelsController],
  providers: [ChannelsService],
})
export class ChannelsModule {}