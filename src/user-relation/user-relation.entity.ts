import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from 'src/users/user.entity';
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

  @Column({
    type: 'enum',
    enum: UserRelationStatusEnum,
  })
  status: UserRelationStatusEnum;
}
