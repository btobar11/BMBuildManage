import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkerPaymentsService } from './worker-payments.service';
import { WorkerPaymentsController } from './worker-payments.controller';
import { WorkerPayment } from './worker-payment.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([WorkerPayment]), AuthModule],
  controllers: [WorkerPaymentsController],
  providers: [WorkerPaymentsService],
  exports: [WorkerPaymentsService],
})
export class WorkerPaymentsModule {}
