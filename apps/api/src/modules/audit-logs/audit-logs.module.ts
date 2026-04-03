import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLog } from './audit-log.entity';
import { AuditLogsService } from './audit-logs.service';
import { AuditSubscriber } from './audit.subscriber';
import { AuditLogsController } from './audit-logs.controller';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([AuditLog])],
  controllers: [AuditLogsController],
  providers: [AuditLogsService, AuditSubscriber],
  exports: [AuditLogsService],
})
export class AuditLogsModule {}

