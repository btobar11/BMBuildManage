import { Module } from '@nestjs/common';
import { BimClashesService } from './bim-clashes.service';
import { BimClashesController } from './bim-clashes.controller';
import { AuthModule } from '../auth/auth.module';
import { BullModule } from '@nestjs/bullmq';
import { BimClashesProcessor } from './bim-clashes.processor';
import { CLASH_DETECTION_QUEUE } from './constants';

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
