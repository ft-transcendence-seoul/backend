import { Injectable, NotFoundException } from '@nestjs/common';
import { DirectMessage } from './entitys/direct-message.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsersService } from 'src/users/users.service';
import { unreadMassageDto } from './dtos/unread-message.dto';

@Injectable()
export class DirectMessagesService {
  constructor(
    @InjectRepository(DirectMessage)
    private directMessageRepository: Repository<DirectMessage>,
    private usersService: UsersService,
  ) {}

  private hashUserIds(userId1: number, userId2: number): string {
    // prettier-ignore
    return userId1 > userId2
      ? userId1 + ':' + userId2
      : userId2 + ':' + userId1;
  }

  findAllMessages(userId: number, otherUserId: number): Promise<DirectMessage[]> {
    const hashKey = this.hashUserIds(userId, otherUserId);
    return this.directMessageRepository.find({
      where: { hashKey },
      relations: {
        sender: true,
      },
      order: {
        createdAt: 'ASC',
      },
    });
  }

  async createMassage(
    senderId: number,
    receiverId: number,
    content: string,
  ): Promise<DirectMessage> {
    const sender = await this.usersService.findById(senderId);
    const receiver = await this.usersService.findById(receiverId);
    if (!sender || !receiver) {
      throw new NotFoundException('잘못된 userid입니다.');
    }

    const hashKey = this.hashUserIds(senderId, receiverId);
    const dm = this.directMessageRepository.create({
      hashKey,
      sender,
      receiver,
      content,
    });

    return this.directMessageRepository.save(dm);
  }

  async refreshUnreadMessages(senderId: number, receiverId: number): Promise<DirectMessage[]> {
    const hashKey = this.hashUserIds(senderId, receiverId);
    const messages = await this.directMessageRepository.findBy({
      hashKey,
      sender: { id: senderId },
      isRead: false,
    });

    for (const message of messages) {
      message.isRead = true;
    }

    return this.directMessageRepository.save(messages);
  }

  async getUnreadMsgCount(userId: number) {
    const result = (await this.directMessageRepository
      .createQueryBuilder('message')
      .where('message.receiver.id = :userId', { userId })
      .andWhere('message.isRead = false')
      .groupBy('message.sender.id')
      .select(['message.sender.id', 'COUNT(*) as count'])
      .getRawMany()) as unreadMassageDto[];

    return result;
  }
}
