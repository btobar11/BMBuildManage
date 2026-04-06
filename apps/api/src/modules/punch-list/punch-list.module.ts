import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PunchItem } from './punch-item.entity';
import { PunchListService } from './punch-list.service';
import { PunchListController } from './punch-list.controller';

@Module({
  imports: [TypeOrmModule.forFeature([PunchItem])],
  providers: [PunchListService],
  controllers: [PunchListController],
  exports: [PunchListService],
})
export class PunchListModule {}
