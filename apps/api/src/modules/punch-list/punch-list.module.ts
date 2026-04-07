import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PunchItem } from './punch-item.entity';
import { PunchListService } from './punch-list.service';
import { PunchListController } from './punch-list.controller';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([PunchItem]),
    forwardRef(() => UsersModule),
  ],
  providers: [PunchListService],
  controllers: [PunchListController],
  exports: [PunchListService],
})
export class PunchListModule {}
