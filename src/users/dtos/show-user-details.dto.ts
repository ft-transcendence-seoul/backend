import { AvatarEnum } from '../enums/avatar.enum';

export class ShowUserDetailsDto {
  email: string;
  nickname: string;
  ladderPoint: number;
  avatar: AvatarEnum;
  bio: string;
  // 전적 정보 추가
}
