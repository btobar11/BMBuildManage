import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Company } from '../companies/company.entity';
import { Resource, ResourceType } from '../resources/resource.entity';
import { ApuTemplate } from '../apu/apu-template.entity';
import { Worker } from '../workers/worker.entity';
import { Unit, UnitCategory } from '../units/unit.entity';
import { Project, ProjectStatus } from '../projects/project.entity';
import { Budget, BudgetStatus } from '../budgets/budget.entity';
import { Stage } from '../stages/stage.entity';
import { Item, ItemType } from '../items/item.entity';
import { Expense, ExpenseType } from '../expenses/expense.entity';
import { ProjectContingency } from '../contingencies/project-contingency.entity';
import { User, UserRole } from '../users/user.entity';

@Injectable()
export class SeedService {
  constructor(
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Resource)
    private readonly resourceRepository: Repository<Resource>,
    @InjectRepository(ApuTemplate)
    private readonly apuRepository: Repository<ApuTemplate>,
    @InjectRepository(Worker)
    private readonly workerRepository: Repository<Worker>,
    @InjectRepository(Unit)
    private readonly unitRepository: Repository<Unit>,
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(Budget)
    private readonly budgetRepository: Repository<Budget>,
    @InjectRepository(Stage)
    private readonly stageRepository: Repository<Stage>,
    @InjectRepository(Item)
    private readonly itemRepository: Repository<Item>,
    @InjectRepository(Expense)
    private readonly expenseRepository: Repository<Expense>,
    @InjectRepository(ProjectContingency)
    private readonly contingencyRepository: Repository<ProjectContingency>,
  ) {}

  async seedDemoData() {
    try {
      const demoCompanyId = '77777777-7777-7777-7777-777777777777';

      // 1. Ensure Demo Company exists
      let company = await this.companyRepository.findOne({
        where: { id: demoCompanyId },
      });
      if (!company) {
        company = this.companyRepository.create({
          id: demoCompanyId,
          name: 'Demo Constructora',
          address: 'Av. Las Condes 12345, Santiago, Chile',
          tax_id: '76.123.456-7',
          phone: '+56 9 1234 5678',
          email: 'contacto@democonstructora.cl',
        });
        await this.companyRepository.save(company);
      }

      // 2. Seed Units
      const unitCount = await this.unitRepository.count();
      if (unitCount === 0) {
        const demoUnits = [
          { name: 'Unidad', symbol: 'un', category: UnitCategory.QUANTITY },
          { name: 'Metro Lineal', symbol: 'm', category: UnitCategory.LENGTH },
          { name: 'Metro Cuadrado', symbol: 'm2', category: UnitCategory.AREA },
          { name: 'Metro Cúbico', symbol: 'm3', category: UnitCategory.VOLUME },
          { name: 'Kilogramo', symbol: 'kg', category: UnitCategory.WEIGHT },
          { name: 'Global', symbol: 'gl', category: UnitCategory.OTHER },
          { name: 'Día', symbol: 'día', category: UnitCategory.TIME },
          { name: 'Mes', symbol: 'mes', category: UnitCategory.TIME },
        ];
        await this.unitRepository.save(this.unitRepository.create(demoUnits));
      }

      const units = await this.unitRepository.find();
      const getUnit = (symbol: string) =>
        units.find((u) => u.symbol === symbol) || units[0];

      // 3. Seed Resources (if none exist for company)
      const resourceCount = await this.resourceRepository.count({
        where: { company_id: demoCompanyId },
      });
      if (resourceCount === 0) {
        const demoResources = [
          {
            name: 'Cemento Especial 42.5kg',
            type: ResourceType.MATERIAL,
            unit: getUnit('un'),
            base_price: 8500,
          },
          {
            name: 'Arena Gruesa',
            type: ResourceType.MATERIAL,
            unit: getUnit('m3'),
            base_price: 22000,
          },
          {
            name: 'Grava 3/4',
            type: ResourceType.MATERIAL,
            unit: getUnit('m3'),
            base_price: 25000,
          },
          {
            name: 'Enfierrador',
            type: ResourceType.LABOR,
            unit: getUnit('día'),
            base_price: 45000,
          },
          {
            name: 'Jornal',
            type: ResourceType.LABOR,
            unit: getUnit('día'),
            base_price: 25000,
          },
          {
            name: 'Maestro Albañil',
            type: ResourceType.LABOR,
            unit: getUnit('día'),
            base_price: 55000,
          },
          {
            name: 'Betonera 150L',
            type: ResourceType.EQUIPMENT,
            unit: getUnit('día'),
            base_price: 15000,
          },
        ];

        for (const res of demoResources) {
          await this.resourceRepository.save(
            this.resourceRepository.create({
              ...res,
              company_id: demoCompanyId,
            }),
          );
        }
      }

      // 4. Seed APU Templates
      const apuCount = await this.apuRepository.count({
        where: { company_id: demoCompanyId },
      });
      if (apuCount === 0) {
        const demoApus = [
          {
            name: 'Hormigón de Cimiento H20',
            description: 'Cimiento de hormigón preparado en obra con betonera.',
            unit: getUnit('m3'),
            category: 'Obra Gruesa',
          },
          {
            name: 'Instalación de Cerámico 40x40',
            description: 'Instalación de cerámico incluye adhesivo y fragüe.',
            unit: getUnit('m2'),
            category: 'Terminaciones',
          },
          {
            name: 'Pintura Látex Exterior',
            description:
              'Aplicación de dos manos de pintura látex de alta calidad.',
            unit: getUnit('m2'),
            category: 'Terminaciones',
          },
        ];

        for (const apu of demoApus) {
          await this.apuRepository.save(
            this.apuRepository.create({
              ...apu,
              company_id: demoCompanyId,
            }),
          );
        }
      }

      // 5. Seed Workers
      const workerCount = await this.workerRepository.count({
        where: { company_id: demoCompanyId },
      });
      if (workerCount === 0) {
        const demoWorkers = [
          {
            name: 'Rodrigo González',
            role: 'Maestro Albañil',
            phone: '+56 9 8765 4321',
            daily_rate: 55000,
            skills: 'Albañilería, Cimientos, Techumbre',
            rating: 5,
            notes: 'Excelente disposición, muy cumplidor con los plazos.',
          },
          {
            name: 'Abigail Jiménez',
            role: 'Pintora / Terminaciones',
            phone: '+56 9 2233 4455',
            daily_rate: 40000,
            skills: 'Pintura, Papel mural, Yeso',
            rating: 4,
            notes: 'Ha trabajado en 5 obras con nosotros. Muy detallista.',
          },
          {
            name: 'Juan Pérez',
            role: 'Ayudante',
            phone: '+56 9 1122 3344',
            daily_rate: 25000,
            skills: 'Carga, Limpieza, Excavación',
            rating: 3,
            notes: 'Buen desempeño general.',
          },
        ];

        for (const w of demoWorkers) {
          await this.workerRepository.save(
            this.workerRepository.create({
              ...w,
              company_id: demoCompanyId,
            }),
          );
        }
      }

      // 6. Seed Demo Projects and Budgets
      {
        // Project 1: Edificio Piloto (Fixed ID for E2E)
        const pilotProjectId = 'f1d2e3f4-a5b6-7890-cdef-123456789012';
        const pilotBudgetId = 'c1d2e3f4-a5b6-7890-cdef-123456789012';
        let project1 = await this.projectRepository.findOne({
          where: { id: pilotProjectId },
        });
        if (!project1) {
          project1 = await this.projectRepository.save(
            this.projectRepository.create({
              id: pilotProjectId,
              name: 'Edificio Piloto',
              description:
                'Proyecto de validación para el Pilot Validation Pack.',
              company_id: demoCompanyId,
              status: ProjectStatus.IN_PROGRESS,
              start_date: new Date('2024-01-15'),
            }),
          );
        }

        let budget1 = await this.budgetRepository.findOne({
          where: { id: pilotBudgetId },
        });
        if (!budget1) {
          budget1 = await this.budgetRepository.save(
            this.budgetRepository.create({
              id: pilotBudgetId,
              project_id: project1.id,
              version: 1,
              status: BudgetStatus.APPROVED,
              is_active: true,
              total_estimated_cost: 6500000,
              total_estimated_price: 8500000,
            }),
          );
        }

        let stage1 = await this.stageRepository.findOne({
          where: { budget_id: budget1.id, name: 'Instalación de Faenas' },
        });
        if (!stage1) {
          stage1 = await this.stageRepository.save(
            this.stageRepository.create({
              budget_id: budget1.id,
              name: 'Instalación de Faenas',
              position: 0,
            }),
          );
        }

        const itemCount = await this.itemRepository.count({
          where: { stage_id: stage1.id },
        });
        if (itemCount === 0) {
          await this.itemRepository.save([
            this.itemRepository.create({
              stage_id: stage1.id,
              name: 'Instalación de faenas',
              unit: 'glb',
              quantity: 1,
              unit_cost: 350000,
              unit_price: 450000,
              position: 0,
              type: ItemType.LABOR,
            }),
            this.itemRepository.create({
              stage_id: stage1.id,
              name: 'Cierre perimetral',
              unit: 'viaje',
              quantity: 3,
              unit_cost: 85000,
              unit_price: 110000,
              position: 1,
              type: ItemType.SUBCONTRACT,
            }),
          ]);
        }

        let stage2 = await this.stageRepository.findOne({
          where: { budget_id: budget1.id, name: 'Terminaciones' },
        });
        if (!stage2) {
          stage2 = await this.stageRepository.save(
            this.stageRepository.create({
              budget_id: budget1.id,
              name: 'Terminaciones',
              position: 1,
            }),
          );
        }

        const item2Count = await this.itemRepository.count({
          where: { stage_id: stage2.id },
        });
        if (item2Count === 0) {
          await this.itemRepository.save([
            this.itemRepository.create({
              stage_id: stage2.id,
              name: 'Piso laminado 8mm',
              unit: 'm2',
              quantity: 65,
              unit_cost: 14500,
              unit_price: 18500,
              position: 0,
              type: ItemType.MATERIAL,
            }),
            this.itemRepository.create({
              stage_id: stage2.id,
              name: 'Pintura látex muros',
              unit: 'm2',
              quantity: 180,
              unit_cost: 4500,
              unit_price: 6000,
              position: 1,
              type: ItemType.MATERIAL,
            }),
          ]);
        }

        // Seed Expenses for Project 1 (only if none exist)
        const expenseCount = await this.expenseRepository.count({
          where: { project_id: project1.id },
        });
        if (expenseCount === 0) {
          await this.expenseRepository.save([
            this.expenseRepository.create({
              project_id: project1.id,
              description: 'Compra de materiales pintura - Sodimac',
              amount: 150000,
              date: new Date(),
              expense_type: ExpenseType.MATERIAL,
              company_id: demoCompanyId,
            }),
            this.expenseRepository.create({
              project_id: project1.id,
              description: 'Pago cuadrilla demolición - Semana 1',
              amount: 450000,
              date: new Date(),
              expense_type: ExpenseType.LABOR,
              company_id: demoCompanyId,
            }),
          ]);
        }

        // Seed Contingencies for Project 1 (only if none exist)
        const contingencyCount = await this.contingencyRepository.count({
          where: { project_id: project1.id },
        });
        if (contingencyCount === 0) {
          await this.contingencyRepository.save([
            this.contingencyRepository.create({
              project_id: project1.id,
              description: 'Emergencia Sanitaria',
              quantity: 1,
              unit_cost: 1000000,
            }),
          ]);
        }

        // Project 2: Casa de Playa Matanzas (Larger scale)
        let project2 = await this.projectRepository.findOne({
          where: { name: 'Casa de Playa Matanzas' },
        });
        if (!project2) {
          project2 = await this.projectRepository.save(
            this.projectRepository.create({
              name: 'Casa de Playa Matanzas',
              description: 'Construcción de vivienda unifamiliar de 140m2.',
              company_id: demoCompanyId,
              status: ProjectStatus.DRAFT,
              start_date: new Date('2024-04-01'),
            }),
          );
        }

        const project2BudgetCount = await this.budgetRepository.count({
          where: { project_id: project2.id },
        });
        if (project2BudgetCount === 0) {
          await this.budgetRepository.save(
            this.budgetRepository.create({
              project_id: project2.id,
              version: 1,
              status: BudgetStatus.DRAFT,
              total_estimated_cost: 115000000,
              total_estimated_price: 145000000,
              stages: [
                {
                  name: 'Instalación de Faenas',
                  position: 0,
                  items: [
                    {
                      name: 'Bodega y oficina temporal',
                      unit: 'glb',
                      quantity: 1,
                      unit_cost: 1200000,
                      unit_price: 1500000,
                      position: 0,
                    },
                    {
                      name: 'Cierre perimetral',
                      unit: 'ml',
                      quantity: 80,
                      unit_cost: 12000,
                      unit_price: 15500,
                      position: 1,
                    },
                  ],
                },
                {
                  name: 'Fundaciones',
                  position: 1,
                  items: [
                    {
                      name: 'Excavaciones manuales',
                      unit: 'm3',
                      quantity: 45,
                      unit_cost: 18000,
                      unit_price: 24000,
                      position: 0,
                    },
                    {
                      name: 'Hormigón de fundaciones G20',
                      unit: 'm3',
                      quantity: 32,
                      unit_cost: 125000,
                      unit_price: 155000,
                      position: 1,
                    },
                  ],
                },
              ],
            } as any),
          );
        }
      }

      return {
        success: true,
        message: 'Demo data seeded successfully with realistic projects',
      };
    } catch (error: any) {
      console.error('Error seeding demo data:', error);
      console.error('Stack trace:', error.stack);
      if (error.detail) console.error('DB Detail:', error.detail);
      throw error;
    }
  }
}
