import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkerAssignmentsService } from './worker-assignments.service';
import { WorkerAssignmentsController } from './worker-assignments.controller';
import { WorkerAssignment } from './worker-assignment.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([WorkerAssignment]), AuthModule],
  controllers: [WorkerAssignmentsController],
  providers: [WorkerAssignmentsService],
  exports: [WorkerAssignmentsService],
})
export class WorkerAssignmentsModule {}
