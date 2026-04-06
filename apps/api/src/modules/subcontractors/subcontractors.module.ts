import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubcontractorsService } from './subcontractors.service';
import { SubcontractorsController } from './subcontractors.controller';
import { Subcontractor, SubcontractorContract, SubcontractorPayment, SubcontractorRAM } from './subcontractor.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Subcontractor, SubcontractorContract, SubcontractorPayment, SubcontractorRAM]),
  ],
  controllers: [SubcontractorsController],
  providers: [SubcontractorsService],
  exports: [SubcontractorsService],
})
export class SubcontractorsModule {}