import { Expose, Transform } from 'class-transformer';

export class unreadMassageDto {
  @Expose({ name: 'message_sender_id' })
  senderId: number;

  @Expose()
  @Transform(({ value }) => (parseInt(value) ? parseInt(value) : 0))
  count: number;
}
