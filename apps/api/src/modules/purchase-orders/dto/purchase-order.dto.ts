import {
  IsString,
  IsOptional,
  IsUUID,
  IsDateString,
  IsNumber,
  IsArray,
  ValidateNested,
  Min,
  MaxLength,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePurchaseOrderItemDto {
  @IsString()
  @MaxLength(300)
  description: string;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsNumber()
  @Min(0)
  quantity_ordered: number;

  @IsNumber()
  @Min(0)
  unit_price: number;

  @IsOptional()
  @IsUUID()
  budget_item_id?: string;

  @IsOptional()
  @IsUUID()
  resource_id?: string;
}

export class CreatePurchaseOrderDto {
  @IsUUID()
  project_id: string;

  @IsString()
  @MaxLength(300)
  supplier_name: string;

  @IsOptional()
  @IsString()
  @MaxLength(12)
  supplier_rut?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  supplier_contact?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  po_number?: string;

  @IsOptional()
  @IsDateString()
  expected_delivery_date?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePurchaseOrderItemDto)
  items: CreatePurchaseOrderItemDto[];
}

export class ReceiveDeliveryItemDto {
  @IsUUID()
  purchase_order_item_id: string;

  @IsNumber()
  @Min(0)
  quantity_received: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class ReceiveDeliveryDto {
  @IsString()
  @MaxLength(200)
  received_by: string;

  @IsDateString()
  reception_date: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  guia_despacho_number?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  photo_url?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReceiveDeliveryItemDto)
  items: ReceiveDeliveryItemDto[];
}

export class MatchInvoiceDto {
  @IsUUID()
  invoice_id: string;
}
