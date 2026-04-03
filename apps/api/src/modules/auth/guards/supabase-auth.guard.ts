import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient } from '@supabase/supabase-js';
import { UsersService } from '../../users/users.service';

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  constructor(
    private configService: ConfigService,
    // @Inject(forwardRef(() => UsersService))
    // private usersService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];

    if (!authHeader || Array.isArray(authHeader) || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid authorization header');
    }

    const token = authHeader.replace('Bearer ', '');

    // Development bypass
    if (token === 'dev-token') {
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

    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    // Fetch user role from DB - TEMPORARILY BYPASSED for DI debugging
    const role = 'admin'; // Hardcoded for diagnostic run
    /*
    try {
      const dbUser = await this.usersService.findOne(data.user.id);
      if (dbUser) role = dbUser.role;
    } catch {
      // User not yet in DB, use default role
    }
    */

    request.user = { ...data.user, company_id: data.user.user_metadata?.company_id, role };
    request.token = token;
    return true;
  }
}
