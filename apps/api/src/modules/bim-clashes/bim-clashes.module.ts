import { Module } from '@nestjs/common';
import { BimClashesService } from './bim-clashes.service';
import { BimClashesController } from './bim-clashes.controller';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [UsersModule],
  controllers: [BimClashesController],
  providers: [BimClashesService],
  exports: [BimClashesService],
})
export class BimClashesModule {}
