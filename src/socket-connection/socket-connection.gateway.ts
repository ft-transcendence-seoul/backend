import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { sessionMiddleware } from '@configs/session.config';
import { ConfigService } from '@nestjs/config';
import { UseFilters } from '@nestjs/common';
import { RedisService } from '../commons/redis-client.service';
import { WebsocketExceptionsFilter } from '../filters/websocket-exception.fileter';
import { corsConfig } from '@configs/cors.config';
import { RedisField } from 'src/commons/enums/redis.enum';

export const PRIVAVE_PREFIX = 'private:';
const SOCKET_ID_PREFIX = 'socket_id:';
const USER_ID_PREFIX = 'user_id:';

@UseFilters(new WebsocketExceptionsFilter())
@WebSocketGateway({
  cors: corsConfig,
})
export class SocketConnectionGateway {
  @WebSocketServer() private server: Server;

  constructor(
    private configService: ConfigService,
    private redisService: RedisService,
  ) {}

  // socket서버가 열릴 때
  afterInit(): void {
    this.server.engine.use(sessionMiddleware(this.configService, this.redisService));
  }

  // client가 연결됬을 때
  async handleConnection(clientSocket: Socket): Promise<void> {
    const userId = await this.getUserIdBySession(clientSocket);
    if (!userId) {
      clientSocket.disconnect(true);
      return;
    }

    // 이미 로그인한 유저가 존재할 때 상대 연결 끊기
    const currentLoginSocket = await this.userToSocket(userId);
    if (currentLoginSocket) {
      await this.removeClientRedis(currentLoginSocket.id, userId);
      currentLoginSocket.disconnect(true);
    }

    await clientSocket.join(PRIVAVE_PREFIX + userId.toString());
    await this.initClientRedis(clientSocket.id, userId);
  }

  // client와 연결이 해제 됬을 때
  async handleDisconnect(clientSocket: Socket): Promise<void> {
    const userId = await this.socketToUserId(clientSocket.id);
    if (userId) this.removeClientRedis(clientSocket.id, userId);
  }

  private async initClientRedis(clientSocketId: string, userId: string | number): Promise<void> {
    await this.redisService.hset(
      SOCKET_ID_PREFIX + clientSocketId,
      RedisField.SOCKET_TO_USER,
      userId,
    );
    await this.redisService.hset(
      USER_ID_PREFIX + userId,
      RedisField.USER_TO_SOCKET,
      clientSocketId,
    );
    await this.redisService.hset(USER_ID_PREFIX + userId, RedisField.USER_STATUS, 'online');
  }

  private async removeClientRedis(clientSocketId: string, userId: string | number): Promise<void> {
    await this.redisService.hdel(SOCKET_ID_PREFIX + clientSocketId, RedisField.SOCKET_TO_USER);
    await this.redisService.hdel(USER_ID_PREFIX + userId, RedisField.USER_TO_SOCKET);
    await this.redisService.hdel(USER_ID_PREFIX + userId, RedisField.USER_STATUS);
  }

  async socketToUserId(socketId: string): Promise<number> {
    const userId = parseInt(
      await this.redisService.hget(SOCKET_ID_PREFIX + socketId, RedisField.SOCKET_TO_USER),
    );
    return userId;
  }

  async userToSocket(userId: number): Promise<Socket | null> {
    const socketId = await this.redisService.hget(
      USER_ID_PREFIX + userId,
      RedisField.USER_TO_SOCKET,
    );
    const socket = this.server.sockets.sockets.get(socketId);
    return socket;
  }

  async getUserIdBySession(clientSocket: Socket): Promise<number | undefined> {
    let session = clientSocket.request.session;
    if (!session.userId) {
      const sessionId = clientSocket.request.headers.authorization;
      session = JSON.parse(await this.redisService.client.get('session:' + sessionId));
    }
    return session?.userId;
  }
}
