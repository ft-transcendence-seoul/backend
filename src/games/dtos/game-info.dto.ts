import { Expose } from 'class-transformer';
import { GamePlayerDto } from './game-player.dto';
import { GameBallDto } from './game-ball.dto';

export class GameInfoDto {
  @Expose()
  me: GamePlayerDto;
  @Expose()
  opponent: GamePlayerDto;
  @Expose()
  ball: GameBallDto;
}
