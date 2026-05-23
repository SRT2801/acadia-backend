import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, QueryFailedError, Repository } from 'typeorm';
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

    try {
      return await this.usersRepository.save(user);
    } catch (error) {
      if (error instanceof QueryFailedError) {
        const driverError = error.driverError;
        if (driverError?.code === '23505') {
          const detail = driverError.detail ?? '';
          if (detail.includes('email')) {
            throw new ConflictException('Email already registered');
          }
          if (detail.includes('username')) {
            throw new ConflictException('Username already taken');
          }
        }
      }
      throw error;
    }
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

  async findByUsername(username: string) {
    return this.usersRepository.findOneBy({ username });
  }

  async findByVerificationToken(verificationToken: string) {
    return this.usersRepository.findOneBy({
      verificationToken,
      emailVerifiedAt: IsNull(),
    });
  }

  async setVerificationToken(id: number, token: string, expiresAt: Date) {
    await this.usersRepository.update(id, {
      verificationToken: token,
      verificationTokenExpiresAt: expiresAt,
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

    try {
      return await this.usersRepository.save(updatedUser);
    } catch (error) {
      if (error instanceof QueryFailedError) {
        const driverError = error.driverError;
        if (driverError?.code === '23505') {
          const detail = driverError.detail ?? '';
          if (detail.includes('email')) {
            throw new ConflictException('Email already registered');
          }
          if (detail.includes('username')) {
            throw new ConflictException('Username already taken');
          }
        }
      }
      throw error;
    }
  }

  async remove(id: number) {
    const result = await this.usersRepository.delete(id);
    return !!result.affected;
  }
}
