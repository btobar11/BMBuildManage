import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Company, CompanySpecialty, SeismicZone } from './company.entity';
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
    private configService: ConfigService,
  ) {
    this.supabase = createClient(
      this.configService.get<string>('supabase.url') ||
        process.env.SUPABASE_URL ||
        '',
      this.configService.get<string>('supabase.anonKey') ||
        process.env.SUPABASE_ANON_KEY ||
        '',
    );
  }

  create(createCompanyDto: CreateCompanyDto) {
    const company = this.companyRepository.create(createCompanyDto);
    return this.companyRepository.save(company);
  }

  findAll() {
    return this.companyRepository.find();
  }

  async findOne(id: string) {
    const company = await this.companyRepository.findOne({ where: { id } });
    if (!company) {
      throw new NotFoundException(`Company with ID ${id} not found`);
    }
    return company;
  }

  async update(id: string, updateCompanyDto: UpdateCompanyDto) {
    const company = await this.findOne(id);
    this.companyRepository.merge(company, updateCompanyDto);
    return this.companyRepository.save(company);
  }

  async remove(id: string) {
    const company = await this.findOne(id);
    await this.companyRepository.remove(company);
    return { deleted: true };
  }

  async seedCompanyLibrary(
    companyId: string,
    seedDto: SeedCompanyLibraryDto,
  ): Promise<SeedingResult> {
    try {
      // Verify company exists and is not already seeded
      const company = await this.findOne(companyId);

      if (company.library_seeded) {
        throw new Error('Company library already seeded');
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

  async getSeededLibraryStats(companyId: string): Promise<{
    isSeeded: boolean;
    seededAt?: Date;
    specialty?: CompanySpecialty;
    seismicZone?: SeismicZone;
    resourcesCount: number;
    apusCount: number;
  }> {
    const company = await this.findOne(companyId);

    // Get counts from Supabase
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
  ): Promise<SeedingResult> {
    if (!force) {
      const company = await this.findOne(companyId);
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
