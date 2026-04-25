import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  BadRequestException,
  PipeTransform,
  Injectable,
  Query,
  Req,
} from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { SeedCompanyLibraryDto } from './dto/seed-company-library.dto';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/user.entity';

@Injectable()
export class IsUUIDValidationPipe implements PipeTransform {
  transform(value: any): string {
    // Relaxed UUID validation for development (allows test UUIDs)
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(value)) {
      throw new BadRequestException('Invalid UUID format');
    }
    return value;
  }
}

@Controller('companies')
@UseGuards(SupabaseAuthGuard)
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Post()
  create(@Body() createCompanyDto: CreateCompanyDto, @Req() req: any) {
    return this.companiesService.create(createCompanyDto, req.user?.id);
  }

  @Get()
  findAll(@Req() req: any) {
    return this.companiesService.findAll(req.user?.company_id);
  }

  @Get(':id')
  findOne(
    @Param('id', new IsUUIDValidationPipe()) id: string,
    @Req() req: any,
  ) {
    return this.companiesService.findOne(id, req.user?.company_id);
  }

  @Patch(':id')
  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  update(
    @Param('id', new IsUUIDValidationPipe()) id: string,
    @Body() updateCompanyDto: UpdateCompanyDto,
    @Req() req: any,
  ) {
    return this.companiesService.update(
      id,
      updateCompanyDto,
      req.user?.company_id,
    );
  }

  @Delete(':id')
  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  remove(@Param('id', new IsUUIDValidationPipe()) id: string, @Req() req: any) {
    return this.companiesService.remove(id, req.user?.company_id);
  }

  // Library Seeding Endpoints

  @Post(':id/seed-library')
  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async seedLibrary(
    @Param('id', new IsUUIDValidationPipe()) id: string,
    @Body() seedDto: SeedCompanyLibraryDto,
    @Req() req: any,
  ) {
    return this.companiesService.seedCompanyLibrary(
      id,
      seedDto,
      req.user?.company_id,
    );
  }

  @Post(':id/reseed-library')
  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async reseedLibrary(
    @Param('id', new IsUUIDValidationPipe()) id: string,
    @Body() seedDto: SeedCompanyLibraryDto,
    @Query('force') force: string = 'false',
    @Req() req: any,
  ) {
    return this.companiesService.reseedCompanyLibrary(
      id,
      seedDto,
      force === 'true',
      req.user?.company_id,
    );
  }

  @Get(':id/library-stats')
  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async getLibraryStats(
    @Param('id', new IsUUIDValidationPipe()) id: string,
    @Req() req: any,
  ) {
    return this.companiesService.getSeededLibraryStats(
      id,
      req.user?.company_id,
    );
  }

  @Get('specialties/available')
  async getAvailableSpecialties() {
    return this.companiesService.getAvailableSpecialties();
  }
}
