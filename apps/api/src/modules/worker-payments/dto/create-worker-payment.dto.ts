import {
  IsString,
  IsOptional,
  IsNumber,
  IsEnum,
  IsDateString,
} from 'class-validator';
import { PaymentType } from '../worker-payment.entity';

export class CreateWorkerPaymentDto {
  @IsString()
  worker_id: string;

  @IsString()
  project_id: string;

  @IsNumber()
  amount: number;

  @IsOptional()
  @IsEnum(PaymentType)
  payment_type?: PaymentType;

  @IsDateString()
  date: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
