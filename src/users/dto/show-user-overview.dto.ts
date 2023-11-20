import { Expose } from 'class-transformer';

export class ShowUserOverviewDto {
  @Expose()
  id: number;

  @Expose()
  nickname: string;

  @Expose()
  ladderPoint: number;

  @Expose()
  avatar: string;
}
