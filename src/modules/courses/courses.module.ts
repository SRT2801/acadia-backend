import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Course } from './entities/course.entity';
import { CourseMember } from './entities/course-member.entity';
import { Invitation } from './entities/invitation.entity';
import { CoursesController } from './courses.controller';
import { CoursesService } from './courses.service';
import { CourseRoleGuard } from './guards/course-role.guard';
import { AcademicSpacesModule } from '../academic-spaces/academic-spaces.module';
import { ChannelsModule } from '../channels/channels.module';
import { FacultiesModule } from '../faculties/faculties.module';
import { CareersModule } from '../careers/careers.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Course, CourseMember, Invitation]),
    AcademicSpacesModule,
    ChannelsModule,
    FacultiesModule,
    CareersModule,
  ],
  controllers: [CoursesController],
  providers: [CoursesService, CourseRoleGuard],
  exports: [CoursesService],
})
export class CoursesModule {}
