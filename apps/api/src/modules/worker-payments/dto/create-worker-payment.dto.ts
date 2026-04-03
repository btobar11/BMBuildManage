import {
  IsString,
  IsOptional,
  IsNumber,
  IsEnum,
  IsDateString,
  Min,
} from 'class-validator';
import { PaymentType } from '../worker-payment.entity';

export class CreateWorkerPaymentDto {
  @IsString()
  worker_id: string;

  @IsString()
  project_id: string;

  @IsNumber()
  @Min(0)
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
