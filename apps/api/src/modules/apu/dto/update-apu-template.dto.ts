import { PartialType } from '@nestjs/mapped-types';
import { CreateApuTemplateDto } from './create-apu-template.dto';

export class UpdateApuTemplateDto extends PartialType(CreateApuTemplateDto) {}
