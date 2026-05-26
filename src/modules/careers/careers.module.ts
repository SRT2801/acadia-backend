import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Career } from './entities/career.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Career])],
  exports: [TypeOrmModule],
})
export class CareersModule {}
