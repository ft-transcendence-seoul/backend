import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { sessionMiddleware } from '@configs/session.config';
import { ConfigService } from '@nestjs/config';
import { NotFoundException, UseFilters } from '@nestjs/common';
import { RedisService } from './redis-client.service';
import { WebsocketExceptionsFilter } from '../filters/websocket-exception.fileter';
import { corsConfig } from '@configs/cors.config';

@UseFilters(new WebsocketExceptionsFilter())
@WebSocketGateway({
  cors: corsConfig,
})
export class MainGateway {
  @WebSocketServer() private server: Server;

  constructor(
    private configService: ConfigService,
    private redisService: RedisService,
  ) {}

  // socket서버가 열릴 때
  afterInit() {
    this.server.engine.use(sessionMiddleware(this.configService, this.redisService));
  }

  // client가 연결됬을 때
  async handleConnection(clientSocket: Socket) {
    const session = clientSocket.request.session;
    const userId = session.userId;
    console.log('client userId:', userId);
    // 세션이 없을때
    if (!userId) {
      clientSocket.disconnect(true);
      return;
    }

    // 이미 로그인한 유저가 존재할 때 상대 연결 끊기
    const existingSessionId = await this.redisService.hget(userId, 'session');
    if (existingSessionId && existingSessionId != session.id) {
      const existingSocketId = await this.redisService.hget(userId, 'userToSocket');
      const existingSocket = this.server.sockets.sockets.get(existingSocketId);
      if (existingSocket) {
        existingSocket.disconnect(true);
        // 상대 session만료시키기?
      }
    }

    clientSocket.join(userId.toString());
    this.initClientRedis(clientSocket.id, userId, session.id);
  }

  // client와 연결이 해제 됬을 때
  async handleDisconnect(clientSocket: Socket) {
    const userId = await this.redisService.hget(clientSocket.id, 'SocketToUser');
    if (userId) this.removeClientRedis(clientSocket.id, userId);
  }

  async initClientRedis(clientSocketId: string, userId: string | number, sessinoId: string) {
    await this.redisService.hset(clientSocketId, 'SocketToUser', userId);
    await this.redisService.hset(userId, 'userToSocket', clientSocketId);
    await this.redisService.hset(userId, 'userStatus', 'online');
    await this.redisService.hset(userId, 'session', sessinoId);
  }

  async removeClientRedis(clientSocketId: string, userId: string | number) {
    await this.redisService.hdel(clientSocketId, 'SocketToUser');
    await this.redisService.hdel(userId, 'userToSocket');
    await this.redisService.hdel(userId, 'userStatus');
    await this.redisService.hdel(userId, 'session');
  }

  async socketToUser(socketId: string) {
    const userId = parseInt(await this.redisService.hget(socketId, 'SocketToUser'));
    if (!userId) {
      throw new NotFoundException('잘못된 소켓id입니다.');
    }
    return userId;
  }
}
