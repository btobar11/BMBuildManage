import { Module } from '@nestjs/common';
import { BimClashesService } from './bim-clashes.service';
import { BimClashesController } from './bim-clashes.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [BimClashesController],
  providers: [BimClashesService],
  exports: [BimClashesService],
})
export class BimClashesModule {}
