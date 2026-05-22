import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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

    return this.sanitizeUser(await this.usersRepository.save(user));
  }

  async findAll() {
    return (await this.usersRepository.find()).map((user) =>
      this.sanitizeUser(user),
    );
  }

  async findOne(id: number) {
    const user = await this.usersRepository.findOneBy({ id });

    return user ? this.sanitizeUser(user) : undefined;
  }

  async findByEmail(email: string) {
    return this.usersRepository.findOneBy({ email });
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    const user = await this.usersRepository.findOneBy({ id });

    if (!user) {
      return undefined;
    }

    const updatedUser = this.usersRepository.merge(user, updateUserDto);
    return this.sanitizeUser(await this.usersRepository.save(updatedUser));
  }

  async remove(id: number) {
    const result = await this.usersRepository.delete(id);

    if (!result.affected) {
      return false;
    }

    return true;
  }

  private sanitizeUser(user: User) {
    const { password, ...safeUser } = user;
    return safeUser;
  }
}
