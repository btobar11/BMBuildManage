import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubcontractorsService } from './subcontractors.service';
import { SubcontractorsController } from './subcontractors.controller';
import {
  Subcontractor,
  SubcontractorContract,
  SubcontractorPayment,
  SubcontractorRAM,
} from './subcontractor.entity';
import { Document } from '../documents/document.entity';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Subcontractor,
      SubcontractorContract,
      SubcontractorPayment,
      SubcontractorRAM,
      Document,
    ]),
    forwardRef(() => UsersModule),
  ],
  controllers: [SubcontractorsController],
  providers: [SubcontractorsService],
  exports: [SubcontractorsService],
})
export class SubcontractorsModule {}
