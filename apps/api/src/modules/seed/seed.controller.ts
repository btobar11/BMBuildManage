import {
  Controller,
  Post,
  Get,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { SeedService } from './seed.service';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/user.entity';

@Controller('seed')
@UseGuards(SupabaseAuthGuard, RolesGuard)
export class SeedController {
  constructor(private readonly seedService: SeedService) {}

  private assertSeedAllowed() {
    if (process.env.NODE_ENV === 'production') {
      throw new ForbiddenException('Seed endpoint disabled in production');
    }
    if (process.env.ALLOW_SEED_ENDPOINT !== 'true') {
      throw new ForbiddenException('Seed endpoint not enabled');
    }
  }

  @Post()
  @Roles(UserRole.ADMIN)
  async seed() {
    this.assertSeedAllowed();
    return this.seedService.seedDemoData();
  }

  @Get('status')
  @Roles(UserRole.ADMIN)
  async status() {
    this.assertSeedAllowed();
    return { status: 'Seed system ready' };
  }
}
