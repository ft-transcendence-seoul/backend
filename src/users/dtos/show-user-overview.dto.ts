import { Expose } from 'class-transformer';
import { AvatarEnum } from '../enums/avatar.enum';

export class ShowUserOverviewDto {
  @Expose()
  id: number;

  @Expose()
  nickname: string;

  @Expose()
  ladderPoint: number;

  @Expose()
  avatar: AvatarEnum;
}
