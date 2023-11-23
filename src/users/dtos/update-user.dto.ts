import { AvatarEnum } from '../enums/avatar.enum';

export class UpdateUserDto {
  nickname: string;
  avatar: AvatarEnum;
  bio: string;
}
