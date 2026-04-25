import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Company, CompanySpecialty, SeismicZone } from './company.entity';
import { User, UserRole } from '../users/user.entity';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { SeedCompanyLibraryDto } from './dto/seed-company-library.dto';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface SeedingResult {
  success: boolean;
  company_id: string;
  specialty: CompanySpecialty;
  seismic_zone?: SeismicZone;
  resources_created: number;
  apus_created: number;
  seeded_at: Date;
  error?: string;
}

@Injectable()
export class CompaniesService {
  private supabase: SupabaseClient;

  constructor(
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private configService: ConfigService,
  ) {
    const supabaseUrl =
      this.configService.get<string>('SUPABASE_URL') ||
      process.env.SUPABASE_URL ||
      '';
    const serviceRoleKey =
      this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY') ||
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      '';
    const anonKey =
      this.configService.get<string>('SUPABASE_ANON_KEY') ||
      process.env.SUPABASE_ANON_KEY ||
      '';

    this.supabase = createClient(
      supabaseUrl,
      // Server-side: prefer service role for RPC/maintenance operations.
      serviceRoleKey || anonKey,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
  }

  async create(createCompanyDto: CreateCompanyDto, createdByUserId?: string) {
    const company = this.companyRepository.create(createCompanyDto);
    const savedCompany = await this.companyRepository.save(company);

    if (createdByUserId) {
      await this.userRepository.update(createdByUserId, {
        company_id: savedCompany.id,
        role: UserRole.ADMIN,
      });
    }

    return savedCompany;
  }

  async findAll(companyId?: string) {
    if (!companyId) return [];
    const company = await this.companyRepository.findOne({
      where: { id: companyId },
    });
    return company ? [company] : [];
  }

  async findOne(id: string, companyId?: string) {
    const company = await this.companyRepository.findOne({ where: { id } });
    if (!company) {
      throw new NotFoundException(`Company with ID ${id} not found`);
    }
    // Security: Verify company belongs to user's company (except for findAll which is admin only)
    if (companyId && company.id !== companyId) {
      throw new NotFoundException(`Company with ID ${id} not found`);
    }
    return company;
  }

  async update(
    id: string,
    updateCompanyDto: UpdateCompanyDto,
    companyId?: string,
  ) {
    const company = await this.findOne(id, companyId);
    this.companyRepository.merge(company, updateCompanyDto);
    return this.companyRepository.save(company);
  }

  async remove(id: string, companyId?: string) {
    if (!companyId || id !== companyId) {
      throw new ForbiddenException('Not authorized to delete this company');
    }
    const company = await this.findOne(id, companyId);
    await this.companyRepository.remove(company);
    return { deleted: true };
  }

  async seedCompanyLibrary(
    companyId: string,
    seedDto: SeedCompanyLibraryDto,
    requestingCompanyId?: string,
  ): Promise<SeedingResult> {
    try {
      // Verify company exists and is not already seeded
      const company = await this.findOne(companyId, requestingCompanyId);

      if (company.library_seeded) {
        throw new Error('Company library already seeded');
      }

      const hasServiceRole =
        Boolean(this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY')) ||
        Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
      if (!hasServiceRole) {
        throw new Error(
          'SUPABASE_SERVICE_ROLE_KEY is required for library seeding',
        );
      }

      // Call PostgreSQL function to perform seeding
      const { data, error } = await this.supabase.rpc('seed_company_library', {
        p_company_id: companyId,
        p_specialty: seedDto.specialty,
        p_seismic_zone: seedDto.seismic_zone || null,
        p_region_code: seedDto.region_code || 'CL-RM',
      });

      if (error) {
        throw new Error(`Seeding failed: ${error.message}`);
      }

      // Update local company record
      await this.companyRepository.update(companyId, {
        specialty: seedDto.specialty,
        seismic_zone: seedDto.seismic_zone,
        region_code: seedDto.region_code,
        library_seeded: true,
        seeded_at: new Date(),
      });

      return {
        success: true,
        company_id: companyId,
        specialty: seedDto.specialty,
        seismic_zone: seedDto.seismic_zone,
        resources_created: data.resources_created || 0,
        apus_created: data.apus_created || 0,
        seeded_at: new Date(data.seeded_at),
      };
    } catch (error) {
      return {
        success: false,
        company_id: companyId,
        specialty: seedDto.specialty,
        seismic_zone: seedDto.seismic_zone,
        resources_created: 0,
        apus_created: 0,
        seeded_at: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async getSeededLibraryStats(
    companyId: string,
    requestingCompanyId?: string,
  ): Promise<{
    isSeeded: boolean;
    seededAt?: Date;
    specialty?: CompanySpecialty;
    seismicZone?: SeismicZone;
    resourcesCount: number;
    apusCount: number;
  }> {
    const company = await this.findOne(companyId, requestingCompanyId);

    // Get counts from Supabase
    const hasServiceRole =
      Boolean(this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY')) ||
      Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
    if (!hasServiceRole) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for seeded stats');
    }

    const [resourcesResult, apusResult] = await Promise.all([
      this.supabase
        .from('resources')
        .select('id', { count: 'exact' })
        .eq('company_id', companyId),
      this.supabase
        .from('apu_templates')
        .select('id', { count: 'exact' })
        .eq('company_id', companyId),
    ]);

    return {
      isSeeded: company.library_seeded,
      seededAt: company.seeded_at || undefined,
      specialty: company.specialty || undefined,
      seismicZone: company.seismic_zone || undefined,
      resourcesCount: resourcesResult.count || 0,
      apusCount: apusResult.count || 0,
    };
  }

  async reseedCompanyLibrary(
    companyId: string,
    seedDto: SeedCompanyLibraryDto,
    force: boolean = false,
    requestingCompanyId?: string,
  ): Promise<SeedingResult> {
    const hasServiceRole =
      Boolean(this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY')) ||
      Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
    if (!hasServiceRole) {
      throw new Error(
        'SUPABASE_SERVICE_ROLE_KEY is required for library reseeding',
      );
    }

    if (!force) {
      const company = await this.findOne(companyId, requestingCompanyId);
      if (company.library_seeded) {
        throw new Error('Company already seeded. Use force=true to reseed.');
      }
    }

    // Clear existing resources and APUs
    await Promise.all([
      this.supabase.from('resources').delete().eq('company_id', companyId),
      this.supabase.from('apu_templates').delete().eq('company_id', companyId),
    ]);

    // Reset seeding status
    await this.companyRepository.update(companyId, {
      library_seeded: false,
      seeded_at: null,
    });

    // Perform new seeding
    return this.seedCompanyLibrary(companyId, seedDto);
  }

  async getAvailableSpecialties(): Promise<{
    specialties: {
      value: CompanySpecialty;
      label: string;
      description: string;
    }[];
    seismicZones: { value: SeismicZone; label: string; description: string }[];
  }> {
    return {
      specialties: [
        {
          value: CompanySpecialty.RESIDENTIAL,
          label: 'Vivienda',
          description: 'Construcción residencial, casas y departamentos',
        },
        {
          value: CompanySpecialty.CIVIL_WORKS,
          label: 'Obras Civiles',
          description: 'Infraestructura, carreteras, puentes y obras públicas',
        },
        {
          value: CompanySpecialty.RENOVATIONS,
          label: 'Remodelaciones',
          description: 'Renovaciones y reparaciones de estructuras existentes',
        },
        {
          value: CompanySpecialty.INDUSTRIAL,
          label: 'Industrial',
          description:
            'Plantas industriales, fábricas y instalaciones productivas',
        },
        {
          value: CompanySpecialty.COMMERCIAL,
          label: 'Comercial',
          description: 'Edificios comerciales, oficinas y centros comerciales',
        },
      ],
      seismicZones: [
        {
          value: SeismicZone.E,
          label: 'Zona E',
          description: 'Zona sísmica E - Riesgo sísmico menor',
        },
        {
          value: SeismicZone.D,
          label: 'Zona D',
          description: 'Zona sísmica D - Riesgo sísmico moderado-bajo',
        },
        {
          value: SeismicZone.C,
          label: 'Zona C',
          description: 'Zona sísmica C - Riesgo sísmico moderado',
        },
        {
          value: SeismicZone.B,
          label: 'Zona B',
          description: 'Zona sísmica B - Riesgo sísmico alto',
        },
        {
          value: SeismicZone.A,
          label: 'Zona A',
          description: 'Zona sísmica A - Riesgo sísmico muy alto',
        },
      ],
    };
  }
}
