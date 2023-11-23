import { AvatarEnum } from '../enums/avatar.enum';

export class ShowUserInforamtionDto {
  id: number;
  email: string;
  nickname: string;
  ladderPoint: number;
  avatar: AvatarEnum;
  bio: string;
  is2fa: boolean;
  // 전적 정보 추가
}
