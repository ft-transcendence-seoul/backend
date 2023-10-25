import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { UserRelationStatusEnum } from 'src/user-relation/enums/user-relation-status.enum';

@Entity()
export class UserRelation {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId ' })
  user: User;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'otherUserId' })
  otherUser: User;

  // @Column({
  //     type: 'enum',
  //     enum: UserRelationStatusEnum,
  // }) // sqlite에서 enum타입 지원안하므로 잠시 지움
  @Column()
  status: UserRelationStatusEnum;
}
