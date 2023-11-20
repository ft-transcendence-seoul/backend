import { Controller, Param, Post, Delete, Get, Put, UseGuards } from '@nestjs/common';
import { UserRelationService } from './user-relation.service';
import { ShowFriendRelationsDto } from './dtos/show-friend-relations.dto';
import { ShowBlockedUsersDto } from './dtos/show-blocked-users.dto';
import { AuthGuard } from 'src/auth/auth.guard';
import { GetUser } from 'src/auth/user.decorator';
import { User } from 'src/users/user.entity';
import { UserByIdPipe } from 'src/pipes/UserById.pipe';

@UseGuards(AuthGuard)
@Controller('user-relation')
export class UserRelationController {
  constructor(private userRelationService: UserRelationService) {}

  @Get('friends')
  async getRelationList(@GetUser() user: User): Promise<ShowFriendRelationsDto[]> {
    const relations = await this.userRelationService.findAllFriendRelations(user.id);
    const showFriendRelationsDtos: ShowFriendRelationsDto[] = relations.map((relation) => {
      const showFriendRelationsDto = new ShowFriendRelationsDto();
      showFriendRelationsDto.otherUserId = relation.otherUser.id;
      showFriendRelationsDto.nickname = relation.otherUser.nickname;
      showFriendRelationsDto.status = relation.status;
      return showFriendRelationsDto;
    });
    return showFriendRelationsDtos;
  }

  @Post('friends/:user_id/request')
  async requestFriend(
    @GetUser() user: User,
    @Param('user_id', UserByIdPipe) otherUser: User,
  ): Promise<void> {
    await this.userRelationService.createFriendRequest(user, otherUser);
  }

  @Delete('friends/:user_id/disconnect')
  async deleteFriend(@GetUser() user: User, @Param('user_id') otherUserId: number): Promise<void> {
    await this.userRelationService.deleteFriendship(user.id, otherUserId);
  }

  @Put('friends/:user_id/accept')
  async acceptFriend(@GetUser() user: User, @Param('user_id') otherUserId: number): Promise<void> {
    await this.userRelationService.establishFriendship(user.id, otherUserId);
  }

  @Delete('friends/:user_id/reject')
  async rejectUser(@GetUser() user: User, @Param('user_id') otherUserId: number): Promise<void> {
    await this.userRelationService.rejectFriendship(user.id, otherUserId);
  }

  @Post('block/:user_id')
  async blockUser(
    @GetUser() user: User,
    @Param('user_id', UserByIdPipe) otherUser: User,
  ): Promise<void> {
    await this.userRelationService.createBlockRelation(user, otherUser);
  }

  @Delete('block/:user_id')
  async unblockUser(@GetUser() user: User, @Param('user_id') otherUserId: number): Promise<void> {
    await this.userRelationService.unblockUserRelation(user.id, otherUserId);
  }

  @Get('block')
  async getblockList(@GetUser() user: User): Promise<ShowBlockedUsersDto[]> {
    const blockedUsers = await this.userRelationService.findAllBlockedUsers(user.id);
    const userDtos: ShowBlockedUsersDto[] = blockedUsers.map((blockedUser) => {
      const userDto = new ShowBlockedUsersDto();
      userDto.otherUserId = blockedUser.id;
      userDto.nickname = blockedUser.nickname;
      return userDto;
    });
    return userDtos;
  }
}
