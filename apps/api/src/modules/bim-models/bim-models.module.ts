import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BimModelsService } from './bim-models.service';
import { BimModelsController } from './bim-models.controller';
import { ProjectModel } from './project-model.entity';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProjectModel]),
    forwardRef(() => UsersModule),
  ],
  controllers: [BimModelsController],
  providers: [BimModelsService],
  exports: [BimModelsService],
})
export class BimModelsModule {}
