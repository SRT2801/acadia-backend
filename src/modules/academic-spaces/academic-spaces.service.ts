import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AcademicSpace } from './entities/academic-space.entity';
import { Visibility } from '../courses/enums/visibility.enum';

@Injectable()
export class AcademicSpacesService {
  constructor(
    @InjectRepository(AcademicSpace)
    private readonly spaceRepo: Repository<AcademicSpace>,
  ) {}

  async createSpace(data: {
    name: string;
    courseId: number;
    ownerId: number;
  }): Promise<AcademicSpace> {
    const slug = data.name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    const space = this.spaceRepo.create({
      name: data.name,
      slug,
      courseId: data.courseId,
      ownerId: data.ownerId,
      visibility: Visibility.PRIVATE,
      settings: {
        allowStudentPosts: true,
        allowFileUploads: true,
        allowVoiceChannels: false,
        showLeaderboard: true,
      },
    });

    return this.spaceRepo.save(space);
  }

  async findByCourseId(courseId: number): Promise<AcademicSpace | null> {
    return this.spaceRepo.findOne({
      where: { courseId },
      relations: ['channels', 'categories'],
    });
  }

  async findByCourseIdOrFail(courseId: number): Promise<AcademicSpace> {
    const space = await this.spaceRepo.findOne({
      where: { courseId },
      relations: ['channels', 'categories', 'channels.category'],
    });

    if (!space) {
      throw new Error('Academic space not found for course');
    }

    return space;
  }

  async updateSpace(
    courseId: number,
    data: { visibility?: Visibility; settings?: Record<string, unknown> },
  ): Promise<AcademicSpace> {
    const space = await this.findByCourseIdOrFail(courseId);
    const merged = this.spaceRepo.merge(space, data);
    return this.spaceRepo.save(merged);
  }
}
