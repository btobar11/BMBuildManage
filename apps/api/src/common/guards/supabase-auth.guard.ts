import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient } from '@supabase/supabase-js';
import { UsersService } from '../../modules/users/users.service';

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  constructor(
    private configService: ConfigService,
    @Inject(forwardRef(() => UsersService))
    private usersService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];

    if (
      !authHeader ||
      Array.isArray(authHeader) ||
      !authHeader.startsWith('Bearer ')
    ) {
      throw new UnauthorizedException(
        'Missing or invalid authorization header',
      );
    }

    const token = authHeader.replace('Bearer ', '');

    if (
      (process.env.NODE_ENV !== 'production' ||
        process.env.ALLOW_DEV_TOKEN === 'true') &&
      token === 'dev-token'
    ) {
      request.user = {
        id: '11111111-1111-1111-1111-111111111111',
        email: 'demo@bmbuild.com',
        company_id: '77777777-7777-7777-7777-777777777777',
        role: 'admin',
      };
      return true;
    }

    const supabase = createClient(
      this.configService.get<string>('SUPABASE_URL') || '',
      this.configService.get<string>('SUPABASE_ANON_KEY') || '',
    );

    const { data, error } = (await supabase.auth.getUser(token)) as {
      data: {
        user: {
          id: string;
          email: string;
          user_metadata?: Record<string, unknown>;
        } | null;
      };
      error: Error | null;
    };

    if (error || !data.user) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    const dbUserData = data.user;
    let role = 'admin';
    let companyId: string | undefined;

    try {
      const dbUser = await this.usersService.findOne(dbUserData.id);
      if (dbUser) {
        role = dbUser.role || 'admin';
        companyId = dbUser.company_id;
      }
    } catch {
      // User not yet in DB, use default role
    }

    const finalCompanyId =
      companyId || (dbUserData.user_metadata?.company_id as string | undefined);

    const isCompanyCreationRequest = 
      request.method === 'POST' && 
      request.path === '/api/v1/companies';

    if (!finalCompanyId && !isCompanyCreationRequest) {
      throw new ForbiddenException(
        'User does not belong to any company. Please contact administrator.',
      );
    }

    request.user = {
      id: dbUserData.id,
      email: dbUserData.email || '',
      company_id: finalCompanyId,
      role,
    };
    return true;
  }
}
