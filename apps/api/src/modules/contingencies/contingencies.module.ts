import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectContingency } from './project-contingency.entity';
import { ContingenciesService } from './contingencies.service';
import { ContingenciesController } from './contingencies.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([ProjectContingency]), AuthModule],
  controllers: [ContingenciesController],
  providers: [ContingenciesService],
  exports: [ContingenciesService],
})
export class ContingenciesModule {}
