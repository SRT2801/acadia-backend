import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Channel } from './entities/channel.entity';
import { ChannelCategory } from './entities/channel-category.entity';
import { ChannelsService } from './channels.service';

@Module({
  imports: [TypeOrmModule.forFeature([Channel, ChannelCategory])],
  providers: [ChannelsService],
  exports: [ChannelsService],
})
export class ChannelsModule {}
