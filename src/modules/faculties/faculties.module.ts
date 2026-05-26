import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Faculty } from './entities/faculty.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Faculty])],
  exports: [TypeOrmModule],
})
export class FacultiesModule {}
