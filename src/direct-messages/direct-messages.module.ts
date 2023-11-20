import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DirectMessage } from './entitys/direct-message.entity';
import { DirectMessagesService } from './direct-messages.service';
import { DirectMessagesGateway } from './direct-messages.gateway';
import { CommonsModule } from 'src/commons/commons.module';
import { UserRelationModule } from 'src/user-relation/user-relation.module';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([DirectMessage]),
    UsersModule,
    UserRelationModule,
    CommonsModule,
  ],
  providers: [DirectMessagesService, DirectMessagesGateway],
})
export class DirectMessagesModule {}
