import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectContingency } from './project-contingency.entity';
import { ContingenciesService } from './contingencies.service';
import { ContingenciesController } from './contingencies.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ProjectContingency])],
  controllers: [ContingenciesController],
  providers: [ContingenciesService],
  exports: [ContingenciesService],
})
export class ContingenciesModule {}
