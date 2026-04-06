import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Rfi } from './rfi.entity';
import { RfisService } from './rfis.service';
import { RfisController } from './rfis.controller';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [TypeOrmModule.forFeature([Rfi]), forwardRef(() => UsersModule)],
  providers: [RfisService],
  controllers: [RfisController],
  exports: [RfisService],
})
export class RfisModule {}
