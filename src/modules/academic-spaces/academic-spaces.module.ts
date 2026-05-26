import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AcademicSpace } from './entities/academic-space.entity';
import { AcademicSpacesService } from './academic-spaces.service';

@Module({
  imports: [TypeOrmModule.forFeature([AcademicSpace])],
  providers: [AcademicSpacesService],
  exports: [AcademicSpacesService],
})
export class AcademicSpacesModule {}
