import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLog } from './audit-log.entity';
import { AuditLogsService } from './audit-logs.service';
import { AuditSubscriber } from './audit.subscriber';
import { AuditLogsController } from './audit-logs.controller';
import { AuthModule } from '../auth/auth.module';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([AuditLog]), AuthModule],
  controllers: [AuditLogsController],
  providers: [AuditLogsService, AuditSubscriber],
  exports: [AuditLogsService],
})
export class AuditLogsModule {}
