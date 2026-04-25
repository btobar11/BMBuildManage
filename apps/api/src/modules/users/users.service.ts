import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { User } from './user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserRole } from './user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  private requireCompanyId(companyId?: string): string {
    if (!companyId) {
      throw new ForbiddenException('Missing company context');
    }
    return companyId;
  }

  create(companyId: string, createUserDto: CreateUserDto) {
    const requiredCompanyId = this.requireCompanyId(companyId);
    if (
      createUserDto.company_id &&
      createUserDto.company_id !== requiredCompanyId
    ) {
      throw new ForbiddenException(
        'Not authorized to create user in another company',
      );
    }
    const user = this.userRepository.create({
      ...createUserDto,
      company_id: requiredCompanyId,
    });
    return this.userRepository.save(user);
  }

  findAll(companyId: string) {
    const requiredCompanyId = this.requireCompanyId(companyId);
    return this.userRepository.find({
      where: { company_id: requiredCompanyId },
      relations: ['company'],
    });
  }

  findByCompany(companyId: string) {
    return this.userRepository.find({ where: { company_id: companyId } });
  }

  async findOne(id: string, companyId?: string) {
    const where = companyId
      ? { id, company_id: this.requireCompanyId(companyId) }
      : { id };

    try {
      const user = await this.userRepository.findOne({
        where,
        relations: companyId ? ['company'] : [],
      });
      if (!user) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }
      return user;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new NotFoundException(`User with ID ${id} not found`);
    }
  }

  async findByEmail(email: string) {
    return this.userRepository.findOne({
      where: { email },
      relations: ['company'],
    });
  }

  async findOneByIdUnsafe(id: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } });
  }

  async ensureUserFromAuth(params: {
    id: string;
    email: string;
    name?: string;
  }): Promise<User> {
    const existing = await this.userRepository.findOne({
      where: { id: params.id },
      relations: ['company'],
    });

    if (existing) {
      // Keep company_id and role as source of truth from DB.
      const nextEmail = params.email || existing.email;
      const nextName = params.name || existing.name;
      if (nextEmail !== existing.email || nextName !== existing.name) {
        existing.email = nextEmail;
        existing.name = nextName;
        return this.userRepository.save(existing);
      }
      return existing;
    }

    const safeName =
      params.name?.trim() || (params.email?.split('@')[0] ?? 'User');

    const user = this.userRepository.create({
      id: params.id,
      email: params.email,
      name: safeName,
      role: UserRole.ENGINEER,
      company_id: null as any,
    });
    return this.userRepository.save(user);
  }

  async update(
    id: string,
    companyId: string,
    updateUserDto: UpdateUserDto,
    requestingUserId: string,
  ) {
    const user = await this.findOne(id, companyId);

    if (requestingUserId === id && updateUserDto.role !== undefined) {
      throw new ForbiddenException('Not authorized to change own role');
    }

    // Prevent moving users across companies via API update.
    const { company_id: _ignoredCompanyId, ...safeUpdate } = updateUserDto;

    this.userRepository.merge(user, safeUpdate);
    return this.userRepository.save(user);
  }

  async remove(id: string, companyId: string) {
    const user = await this.findOne(id, companyId);
    await this.userRepository.remove(user);
    return { deleted: true };
  }
}
