import { IsNumber, IsString } from 'class-validator';

export class DirectMessageReceiveDto {
  @IsNumber()
  receiverId: number;

  @IsString()
  content: string;
}
