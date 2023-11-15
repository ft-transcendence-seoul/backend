import { IsEnum, IsString, MaxLength, MinLength, IsNotEmpty, ValidateIf } from 'class-validator';
import { ChannelType } from '../entities/channel.entity';

export class ChannelDto {
  @IsString()
  @MaxLength(20)
  title: string;

  @IsString()
  @ValidateIf(o => o.type === ChannelType.protected) // 오직 protected일 때만 적용
  @IsNotEmpty()
  @MinLength(4)
  password?: string; // ? 이것으로 public private 채널에서 비밀번호를 필요 없게 만든다

  @IsEnum(ChannelType)
  type: ChannelType;
}