import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Invoice } from './invoice.entity';
import { InvoiceItem } from './invoice-item.entity';
import { InvoicesService } from './invoices.service';
import { InvoicesController } from './invoices.controller';
import { DteXmlBuilderService } from './services/dte-xml-builder.service';

@Module({
  imports: [TypeOrmModule.forFeature([Invoice, InvoiceItem])],
  controllers: [InvoicesController],
  providers: [InvoicesService, DteXmlBuilderService],
  exports: [InvoicesService, DteXmlBuilderService],
})
export class InvoicesModule {}
