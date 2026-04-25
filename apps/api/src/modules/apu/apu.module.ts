import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApuTemplate } from './apu-template.entity';
import { ApuResource } from './apu-resource.entity';
import { Resource } from '../resources/resource.entity';
import { ApuService } from './apu.service';
import { ApuController } from './apu.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ApuTemplate, ApuResource, Resource])],
  controllers: [ApuController],
  providers: [ApuService],
  exports: [ApuService],
})
export class ApuModule {}
