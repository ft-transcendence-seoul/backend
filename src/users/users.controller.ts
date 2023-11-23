import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { ShowUserOverviewDto } from './dtos/show-user-overview.dto';
import { ShowUserDetailsDto } from './dtos/show-user-details.dto';
import { UpdateUserDto } from './dtos/update-user.dto';
import { AuthGuard } from 'src/auth/auth.guard';
import { GetUser } from 'src/auth/user.decorator';
import { User } from './user.entity';
import { UserByIdPipe } from 'src/pipes/UserById.pipe';
import { ShowUserInforamtionDto } from './dtos/show-user-information';

@UseGuards(AuthGuard)
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  async getUsersOverview(): Promise<ShowUserOverviewDto[]> {
    const users = await this.usersService.findAllUsers();
    const userDtos: ShowUserOverviewDto[] = users.map((user) => {
      const userDto = new ShowUserOverviewDto();
      userDto.id = user.id;
      userDto.avatar = user.avatar;
      userDto.ladderPoint = user.ladderPoint;
      userDto.nickname = user.nickname;
      return userDto;
    });
    return userDtos;
  }

  @Get('me')
  getUserInfomation(@GetUser() user: User): ShowUserInforamtionDto {
    const userDto = new ShowUserInforamtionDto();
    userDto.id = user.id;
    userDto.avatar = user.avatar;
    userDto.bio = user.bio;
    userDto.email = user.email;
    userDto.ladderPoint = user.ladderPoint;
    userDto.nickname = user.nickname;
    return userDto;
  }

  @Get(':user_id')
  getUserDetails(@Param('user_id', UserByIdPipe) user: User): ShowUserDetailsDto {
    const userDto = new ShowUserDetailsDto();
    userDto.avatar = user.avatar;
    userDto.bio = user.bio;
    userDto.email = user.email;
    userDto.ladderPoint = user.ladderPoint;
    userDto.nickname = user.nickname;
    return userDto;
  }

  @Put('me')
  async updateUser(@GetUser() user: User, @Body() userDto: UpdateUserDto): Promise<void> {
    await this.usersService.updateUser(user, userDto);
  }
}
