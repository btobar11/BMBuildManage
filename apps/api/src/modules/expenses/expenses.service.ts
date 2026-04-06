import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Expense } from './expense.entity';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';

@Injectable()
export class ExpensesService {
  constructor(
    @InjectRepository(Expense)
    private readonly expenseRepository: Repository<Expense>,
  ) {}

  create(createExpenseDto: CreateExpenseDto) {
    const expense = this.expenseRepository.create(createExpenseDto);
    return this.expenseRepository.save(expense);
  }

  findAllByProject(projectId: string, companyId: string) {
    return this.expenseRepository.find({
      where: {
        project_id: projectId,
        company_id: companyId,
      },
    });
  }

  async findOne(id: string) {
    const expense = await this.expenseRepository.findOne({ where: { id } });
    if (!expense) {
      throw new NotFoundException(`Expense with ID ${id} not found`);
    }
    return expense;
  }

  async update(id: string, updateExpenseDto: UpdateExpenseDto) {
    const expense = await this.findOne(id);
    this.expenseRepository.merge(expense, updateExpenseDto);
    return this.expenseRepository.save(expense);
  }

  async remove(id: string) {
    const expense = await this.findOne(id);
    await this.expenseRepository.remove(expense);
    return { deleted: true };
  }

  async getSummaryByProject(projectId: string) {
    const result = await this.expenseRepository
      .createQueryBuilder('expense')
      .select('SUM(expense.amount)', 'total')
      .where('expense.project_id = :projectId', { projectId })
      .getRawOne();
    return { total: Number(result?.total || 0) };
  }
}
