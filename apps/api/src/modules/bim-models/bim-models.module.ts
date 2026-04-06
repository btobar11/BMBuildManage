import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BimModelsService } from './bim-models.service';
import { BimModelsController } from './bim-models.controller';
import { ProjectModel } from './project-model.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ProjectModel])],
  controllers: [BimModelsController],
  providers: [BimModelsService],
  exports: [BimModelsService],
})
export class BimModelsModule {}