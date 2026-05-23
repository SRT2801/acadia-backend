import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto) {
    const user = this.usersRepository.create({
      ...createUserDto,
      status: createUserDto.status ?? 'ACTIVE',
    });

    return await this.usersRepository.save(user);
  }

  async findAll() {
    return await this.usersRepository.find();
  }

  async findOne(id: number) {
    const user = await this.usersRepository.findOneBy({ id });
    return user ? user : undefined;
  }

  async findByEmail(email: string) {
    return this.usersRepository.findOneBy({ email });
  }

  async findByVerificationToken(verificationToken: string) {
    return this.usersRepository.findOneBy({
      verificationToken,
      emailVerifiedAt: IsNull(),
    });
  }

  async setVerificationToken(id: number, token: string) {
    await this.usersRepository.update(id, {
      verificationToken: token,
    });
  }

  async markEmailVerified(id: number) {
    const user = await this.usersRepository.findOneByOrFail({ id });
    user.emailVerifiedAt = new Date();
    user.verificationToken = null as any;
    await this.usersRepository.save(user);
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    const user = await this.usersRepository.findOneBy({ id });

    if (!user) {
      return undefined;
    }

    const updatedUser = this.usersRepository.merge(user, updateUserDto);
    return await this.usersRepository.save(updatedUser);
  }

  async remove(id: number) {
    const result = await this.usersRepository.delete(id);
    return !!result.affected;
  }
}
