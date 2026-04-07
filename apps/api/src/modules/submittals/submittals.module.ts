import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Submittal } from './submittal.entity';
import { SubmittalsService } from './submittals.service';
import { SubmittalsController } from './submittals.controller';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Submittal]),
    forwardRef(() => UsersModule),
  ],
  providers: [SubmittalsService],
  controllers: [SubmittalsController],
  exports: [SubmittalsService],
})
export class SubmittalsModule {}
