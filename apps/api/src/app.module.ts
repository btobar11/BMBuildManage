import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
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

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get('DATABASE_URL'),
        autoLoadEntities: true,
        synchronize: false, // Use migrations for schema changes
        logging: true,
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    CompaniesModule,
    UsersModule,
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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
