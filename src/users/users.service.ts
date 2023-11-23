import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './user.entity';
import { FindOneOptions, Repository } from 'typeorm';
import { CreateUserDto } from './dtos/create-user.dto';
import { UpdateUserDto } from './dtos/update-user.dto';
import { SecureShieldService } from 'src/secure-shield/secure-shield.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private secureShieldService: SecureShieldService,
  ) {}

  findAllUsers(): Promise<User[]> {
    return this.userRepository.find();
  }

  createUser(userEmail: string, createUserDto: CreateUserDto): Promise<User> {
    return this.userRepository.save({
      email: userEmail,
      ...createUserDto,
    });
  }

  findById(id: number): Promise<User> {
    return this.userRepository.findOneBy({ id });
  }

  findByEmail(email: string): Promise<User> {
    const options: FindOneOptions<User> = { where: { email } };
    return this.userRepository.findOne(options);
  }

  updateUser(user: User, updateUserDto: UpdateUserDto) {
    Object.assign(user, updateUserDto);
    return this.userRepository.save(user);
  }

  async activate2fa(user: User): Promise<void> {
    if (user.is2fa) {
      throw new BadRequestException('2단계 인증이 이미 활성화 상태입니다.');
    }
    user.is2fa = true;
    await this.userRepository.save(user);
  }

  async deactivate2fa(user: User): Promise<void> {
    if (user.is2fa === false) {
      throw new BadRequestException('2단계 인증이 이미 비활성화 상태입니다.');
    }
    user.is2fa = false;
    user.otpSecret = null;
    await this.userRepository.save(user);
  }

  async createSecretKey(user: User): Promise<void> {
    user.otpSecret = this.secureShieldService.encrypt(this.secureShieldService.generateSecretKey());
    await this.userRepository.save(user);
  }
}
