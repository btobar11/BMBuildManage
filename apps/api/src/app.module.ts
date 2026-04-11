import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { CompaniesModule } from './modules/companies/companies.module';
import { UsersModule } from './modules/users/users.module';
import { ClientsModule } from './modules/clients/clients.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { BudgetsModule } from './modules/budgets/budgets.module';
import { StagesModule } from './modules/stages/stages.module';
import { ItemsModule } from './modules/items/items.module';
import { ExpensesModule } from './modules/expenses/expenses.module';
import { WorkersModule } from './modules/workers/workers.module';
import { WorkerAssignmentsModule } from './modules/worker-assignments/worker-assignments.module';
import { WorkerPaymentsModule } from './modules/worker-payments/worker-payments.module';
import { TemplatesModule } from './modules/templates/templates.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { MachineryModule } from './modules/machinery/machinery.module';
import { MaterialsModule } from './modules/materials/materials.module';
import { InvoicesModule } from './modules/invoices/invoices.module';
import { ResourcesModule } from './modules/resources/resources.module';
import { ApuModule } from './modules/apu/apu.module';
import { ExecutionModule } from './modules/execution/execution.module';
import { ContingenciesModule } from './modules/contingencies/contingencies.module';
import { UnitsModule } from './modules/units/units.module';
import { SeedModule } from './modules/seed/seed.module';
import { AuditLogsModule } from './modules/audit-logs/audit-logs.module';
import { BimClashesModule } from './modules/bim-clashes/bim-clashes.module';
import { RfisModule } from './modules/rfis/rfis.module';
import { SubmittalsModule } from './modules/submittals/submittals.module';
import { PunchListModule } from './modules/punch-list/punch-list.module';
import { AIModule } from './modules/ai/ai.module';
import { ScheduleModule } from './modules/schedule/schedule.module';
import { SubcontractorsModule } from './modules/subcontractors/subcontractors.module';
import { BimModelsModule } from './modules/bim-models/bim-models.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { BimApuLinkModule } from './modules/bim-apu-link/bim-apu-link.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: process.env.NODE_ENV === 'test' ? '.env.test' : '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const isProduction =
          configService.get<string>('NODE_ENV') === 'production';

        // SEC-002: Hard safety guard — synchronize MUST be false in production.
        // TypeORM synchronize can silently drop columns/tables on entity drift.
        const synchronize = isProduction ? false : true;

        if (isProduction && synchronize) {
          throw new Error(
            '[SEC-002] FATAL: TypeORM synchronize=true in production. Aborting.',
          );
        }

        // Production: use explicit migrations only
        return {
          type: 'postgres',
          url: configService.get<string>('DATABASE_URL'),
          autoLoadEntities: true,
          synchronize: false, // A2: Explicitly disabled - migrations required
          logging: isProduction ? false : true,
          ssl: isProduction ? { rejectUnauthorized: false } : false,
          migrationsRun: false,
          migrations: ['src/database/migrations/*{.ts,.js}'],
        };
      },
      inject: [ConfigService],
    }),
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 60000,
        limit: 100,
      },
      {
        name: 'medium',
        ttl: 600000,
        limit: 300,
      },
      {
        name: 'long',
        ttl: 3600000,
        limit: 1000,
      },
    ]),
    AuthModule,
    CompaniesModule,
    ClientsModule,
    ProjectsModule,
    BudgetsModule,
    StagesModule,
    ItemsModule,
    ExpensesModule,
    WorkersModule,
    WorkerAssignmentsModule,
    WorkerPaymentsModule,
    TemplatesModule,
    DocumentsModule,
    MachineryModule,
    MaterialsModule,
    InvoicesModule,
    ResourcesModule,
    ApuModule,
    ExecutionModule,
    ContingenciesModule,
    UnitsModule,
    SeedModule,
    AuditLogsModule,
    BimClashesModule,
    RfisModule,
    SubmittalsModule,
    PunchListModule,
    AIModule,
    ScheduleModule,
    SubcontractorsModule,
    BimModelsModule,
    UsersModule,
    AnalyticsModule,
    BimApuLinkModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: 'APP_GUARD',
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
