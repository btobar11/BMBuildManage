import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Machinery } from './machinery.entity';
import { MachineryService } from './machinery.service';
import { MachineryController } from './machinery.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Machinery])],
  controllers: [MachineryController],
  providers: [MachineryService],
  exports: [MachineryService],
})
export class MachineryModule {}
