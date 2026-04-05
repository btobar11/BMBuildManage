import { Module } from '@nestjs/common';
import { BimClashesService } from './bim-clashes.service';
import { BimClashesController } from './bim-clashes.controller';

@Module({
  controllers: [BimClashesController],
  providers: [BimClashesService],
  exports: [BimClashesService],
})
export class BimClashesModule {}
