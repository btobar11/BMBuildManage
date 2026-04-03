import { Controller, Post, Get } from '@nestjs/common';
import { SeedService } from './seed.service';

@Controller('seed')
export class SeedController {
  constructor(private readonly seedService: SeedService) {}

  @Post()
  async seed() {
    return this.seedService.seedDemoData();
  }

  @Get('status')
  async status() {
    return { status: 'Seed system ready' };
  }
}
