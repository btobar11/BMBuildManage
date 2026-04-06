import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Rfi } from './rfi.entity';
import { RfisService } from './rfis.service';
import { RfisController } from './rfis.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Rfi])],
  providers: [RfisService],
  controllers: [RfisController],
  exports: [RfisService],
})
export class RfisModule {}
