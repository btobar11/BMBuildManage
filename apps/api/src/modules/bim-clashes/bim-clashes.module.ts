import { Module } from '@nestjs/common';
import { BimClashesService } from './bim-clashes.service';
import { BimClashesController } from './bim-clashes.controller';
import { AuthModule } from '../auth/auth.module';
import { BullModule } from '@nestjs/bullmq';
import {
  BimClashesProcessor,
  CLASH_DETECTION_QUEUE,
} from './bim-clashes.processor';

@Module({
  imports: [
    AuthModule,
    BullModule.registerQueue({
      name: CLASH_DETECTION_QUEUE,
    }),
  ],
  controllers: [BimClashesController],
  providers: [BimClashesService, BimClashesProcessor],
  exports: [BimClashesService],
})
export class BimClashesModule {}
