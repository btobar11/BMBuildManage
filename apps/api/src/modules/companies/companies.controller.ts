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
} from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { SeedCompanyLibraryDto } from './dto/seed-company-library.dto';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';

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
  create(@Body() createCompanyDto: CreateCompanyDto) {
    return this.companiesService.create(createCompanyDto);
  }

  @Get()
  findAll() {
    return this.companiesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', new IsUUIDValidationPipe()) id: string) {
    return this.companiesService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', new IsUUIDValidationPipe()) id: string,
    @Body() updateCompanyDto: UpdateCompanyDto,
  ) {
    return this.companiesService.update(id, updateCompanyDto);
  }

  @Delete(':id')
  remove(@Param('id', new IsUUIDValidationPipe()) id: string) {
    return this.companiesService.remove(id);
  }

  // Library Seeding Endpoints

  @Post(':id/seed-library')
  async seedLibrary(
    @Param('id', new IsUUIDValidationPipe()) id: string,
    @Body() seedDto: SeedCompanyLibraryDto,
  ) {
    return this.companiesService.seedCompanyLibrary(id, seedDto);
  }

  @Post(':id/reseed-library')
  async reseedLibrary(
    @Param('id', new IsUUIDValidationPipe()) id: string,
    @Body() seedDto: SeedCompanyLibraryDto,
    @Query('force') force: string = 'false',
  ) {
    return this.companiesService.reseedCompanyLibrary(
      id,
      seedDto,
      force === 'true',
    );
  }

  @Get(':id/library-stats')
  async getLibraryStats(@Param('id', new IsUUIDValidationPipe()) id: string) {
    return this.companiesService.getSeededLibraryStats(id);
  }

  @Get('specialties/available')
  async getAvailableSpecialties() {
    return this.companiesService.getAvailableSpecialties();
  }
}
