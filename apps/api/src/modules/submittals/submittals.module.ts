import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Submittal } from './submittal.entity';
import { SubmittalsService } from './submittals.service';
import { SubmittalsController } from './submittals.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Submittal])],
  providers: [SubmittalsService],
  controllers: [SubmittalsController],
  exports: [SubmittalsService],
})
export class SubmittalsModule {}
