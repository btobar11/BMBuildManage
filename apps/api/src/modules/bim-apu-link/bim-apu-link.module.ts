import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BimApuLink } from './bim-apu-link.entity';
import { BimApuLinkService } from './bim-apu-link.service';
import { BimApuLinkController } from './bim-apu-link.controller';
import { Item } from '../items/item.entity';
import { Stage } from '../stages/stage.entity';
import { Budget } from '../budgets/budget.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      BimApuLink,
      Item,
      Stage,
      Budget,
    ]),
  ],
  providers: [BimApuLinkService],
  controllers: [BimApuLinkController],
  exports: [BimApuLinkService],
})
export class BimApuLinkModule {}