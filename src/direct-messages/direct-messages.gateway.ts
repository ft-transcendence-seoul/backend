import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { DirectMessageReceiveDto } from './dtos/direct-message-receive.dto';
import { DirectMessagesService } from './direct-messages.service';
import {
  BadRequestException,
  ParseIntPipe,
  UseFilters,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { WebsocketExceptionsFilter } from 'src/filters/websocket-exception.fileter';
import { corsConfig } from '@configs/cors.config';
import { UserRelationService } from 'src/user-relation/user-relation.service';
import { Serialize } from 'src/interceptors/serializer.interceptor';
import { DirectMessageDto } from './dtos/direct-message.dto';
import { plainToInstance } from 'class-transformer';
import { unreadMassageDto } from './dtos/unread-message.dto';
import { MainGateway } from 'src/commons/main.gateway';

@UseFilters(new WebsocketExceptionsFilter())
@UsePipes(new ValidationPipe())
@WebSocketGateway({
  cors: corsConfig,
})
export class DirectMessagesGateway {
  @WebSocketServer() server: Server;

  constructor(
    private directMessagesService: DirectMessagesService,
    private userRelationService: UserRelationService,
    private mainGateWay: MainGateway,
  ) {}

  @SubscribeMessage('DM')
  async communicateDirectMessage(
    @ConnectedSocket() clientSocket: Socket,
    @MessageBody() { receiverId, content }: DirectMessageReceiveDto,
  ) {
    const senderId = await this.mainGateWay.socketToUser(clientSocket.id);
    if (!(await this.userRelationService.isFriendRelation(senderId, receiverId))) {
      throw new BadRequestException('친구사이에만 dm을 할 수 있습니다.');
    }

    const dm = await this.directMessagesService.createMassage(senderId, receiverId, content);
    const dmDto = plainToInstance(DirectMessageDto, dm, {
      excludeExtraneousValues: true,
      enableImplicitConversion: true,
    });

    // prettier-ignore
    this.server
      .to(receiverId.toString())
      .to(senderId.toString())
      .emit('DM', dmDto);
  }

  @SubscribeMessage('DM-read')
  async refreshUnreadMessages(
    @ConnectedSocket() clientSocket: Socket,
    @MessageBody('senderId', ParseIntPipe) senderId: number,
  ) {
    const receiverId = await this.mainGateWay.socketToUser(clientSocket.id);
    if (!(await this.userRelationService.isFriendRelation(senderId, receiverId))) {
      throw new BadRequestException('친구사이에만 dm을 사용할 수 있습니다.');
    }
    await this.directMessagesService.refreshUnreadMessages(senderId, receiverId);

    return { readAt: new Date() };
  }

  @SubscribeMessage('DM-messages')
  @Serialize(DirectMessageDto)
  async findAllDirectMessages(
    @ConnectedSocket() clientSocket: Socket,
    @MessageBody('otherUserId', ParseIntPipe) otherUserId: number,
  ) {
    const userId = await this.mainGateWay.socketToUser(clientSocket.id);
    if (!(await this.userRelationService.isFriendRelation(userId, otherUserId))) {
      throw new BadRequestException('친구사이에만 dm을 사용할 수 있습니다.');
    }
    const messages = await this.directMessagesService.findAllMessages(userId, otherUserId);

    return messages;
  }

  @SubscribeMessage('DM-unread-count')
  @Serialize(unreadMassageDto)
  async unReadMessageDirectCount(@ConnectedSocket() clientSocket: Socket) {
    const userId = await this.mainGateWay.socketToUser(clientSocket.id);
    const unreadMassagesCount = await this.directMessagesService.getUnreadMsgCount(userId);

    return unreadMassagesCount;
  }
}
