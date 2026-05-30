import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { University } from '../universities/entities/university.entity';

describe('UsersService', () => {
  let service: UsersService;
  let repo: jest.Mocked<Repository<User>>;
  let universityRepo: jest.Mocked<Repository<University>>;

  beforeEach(async () => {
    repo = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOneBy: jest.fn(),
      findOneByOrFail: jest.fn(),
      update: jest.fn(),
      merge: jest.fn(),
      delete: jest.fn(),
    } as any;

    universityRepo = {
      findOne: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: repo },
        { provide: getRepositoryToken(University), useValue: universityRepo },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create a user', async () => {
    const dto = {
      email: 'test@test.com',
      password: 'hashed',
      firstName: 'T',
      lastName: 'U',
      roleId: 1,
      universityId: 1,
    };
    universityRepo.findOne.mockResolvedValue({ id: 1 } as any);
    repo.create.mockReturnValue(dto as any);
    repo.save.mockResolvedValue({ id: 1, ...dto } as any);

    const result = await service.create(dto);

    expect(repo.create).toHaveBeenCalledWith({ ...dto, status: 'ACTIVE' });
    expect(repo.save).toHaveBeenCalled();
    expect(result.id).toBe(1);
  });

  it('should find by email', async () => {
    const user = { id: 1, email: 'test@test.com' };
    repo.findOneBy.mockResolvedValue(user as any);

    const result = await service.findByEmail('test@test.com');

    expect(repo.findOneBy).toHaveBeenCalledWith({ email: 'test@test.com' });
    expect(result).toEqual(user);
  });

  it('should mark email as verified', async () => {
    const user = {
      id: 1,
      emailVerifiedAt: undefined,
      verificationToken: 'token',
    };
    repo.findOneByOrFail.mockResolvedValue(user as any);
    repo.save.mockImplementation(async (u) => u as any);

    await service.markEmailVerified(1);

    expect(user.emailVerifiedAt).toBeInstanceOf(Date);
    expect(user.verificationToken).toBeNull();
    expect(repo.save).toHaveBeenCalledWith(user);
  });
});
