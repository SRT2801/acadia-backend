import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { University } from './entities/university.entity';
import { CreateUniversityDto } from './dto/create-university.dto';
import { UpdateUniversityDto } from './dto/update-university.dto';

@Injectable()
export class UniversitiesService {
  constructor(
    @InjectRepository(University)
    private readonly universitiesRepository: Repository<University>,
  ) {}

  async create(createUniversityDto: CreateUniversityDto) {
    const existing = await this.universitiesRepository.findOne({
      where: [
        { name: createUniversityDto.name },
        { domain: createUniversityDto.domain },
      ],
    });

    if (existing) {
      throw new ConflictException('University name or domain already exists');
    }

    const university = this.universitiesRepository.create(createUniversityDto);
    return this.universitiesRepository.save(university);
  }

  async findAll() {
    return this.universitiesRepository.find({ order: { name: 'ASC' } });
  }

  async search(query: string) {
    return this.universitiesRepository.find({
      where: { name: ILike(`%${query}%`) },
      order: { name: 'ASC' },
      take: 20,
    });
  }

  async findByDomain(domain: string) {
    return this.universitiesRepository.findOne({ where: { domain } });
  }

  async findOne(id: number) {
    const university = await this.universitiesRepository.findOneBy({ id });
    if (!university) {
      throw new NotFoundException('University not found');
    }
    return university;
  }

  async update(id: number, updateUniversityDto: UpdateUniversityDto) {
    const university = await this.findOne(id);
    const updated = this.universitiesRepository.merge(
      university,
      updateUniversityDto,
    );
    return this.universitiesRepository.save(updated);
  }

  async remove(id: number) {
    const result = await this.universitiesRepository.delete(id);
    return !!result.affected;
  }
}
