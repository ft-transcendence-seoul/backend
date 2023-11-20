import { Expose } from 'class-transformer';
import { ShowUserOverviewDto } from 'src/users/dto/show-user-overview.dto';

export class DirectMessageDto {
  @Expose()
  id: number;

  @Expose()
  sender: ShowUserOverviewDto;

  @Expose()
  content: string;

  @Expose()
  createdAt: Date;
}
