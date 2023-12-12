import { Module } from '@nestjs/common';
import { ChannelsController } from './channels.controller';
import { ChannelsService } from './channels.service';
import { UsersModule } from 'src/users/users.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Channel } from './entities/channel.entity';
import { ChannelRelation } from './entities/channel-relation.entity';
import { ChannelInvitation } from './entities/channel-invitation.entity';
import { ChannelGateway } from './channels.gateway';
import { UserRelationModule } from 'src/user-relation/user-relation.module';
import { SocketConnectionModule } from 'src/socket-connection/socket-connection.module';
import { CommonsModule } from 'src/commons/commons.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Channel, ChannelRelation, ChannelInvitation]),
    UsersModule,
    UserRelationModule,
    SocketConnectionModule,
    CommonsModule,
  ],
  controllers: [ChannelsController],
  providers: [ChannelsService, ChannelGateway],
  exports: [ChannelsService],
})
export class ChannelsModule {}
