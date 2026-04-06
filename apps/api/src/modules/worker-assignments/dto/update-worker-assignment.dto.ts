import { PartialType } from '@nestjs/mapped-types';
import { CreateWorkerAssignmentDto } from './create-worker-assignment.dto';

export class UpdateWorkerAssignmentDto extends PartialType(
  CreateWorkerAssignmentDto,
) {}
