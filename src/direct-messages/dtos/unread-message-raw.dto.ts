import { IsNumber, IsNumberString } from 'class-validator';

export class unreadMassageRawDto {
  @IsNumber()
  message_sender_id: number;

  @IsNumberString()
  count: string;
}
