import { Test, type TestingModule } from '@nestjs/testing';
import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseAuthGuard } from './supabase-auth.guard';
import { UsersService } from '../../modules/users/users.service';

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getUser: jest.fn(),
    },
  })),
}));

describe('SupabaseAuthGuard', () => {
  let guard: SupabaseAuthGuard;
  let usersService: jest.Mocked<UsersService>;

  const mockExecutionContext = (opts?: {
    headers?: Record<string, any>;
    method?: string;
    path?: string;
  }) => {
    const request = {
      headers: opts?.headers ?? {},
      method: opts?.method ?? 'GET',
      path: opts?.path ?? '/api/v1/projects',
      user: null,
    };

    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as any;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SupabaseAuthGuard,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
        {
          provide: UsersService,
          useValue: {
            ensureUserFromAuth: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get(SupabaseAuthGuard);
    usersService = module.get(UsersService);
  });

  it('throws UnauthorizedException when no authorization header', async () => {
    const context = mockExecutionContext();
    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('throws UnauthorizedException when authorization header is array', async () => {
    const context = mockExecutionContext({
      headers: { authorization: ['Bearer token'] },
    });
    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('throws UnauthorizedException when token does not start with Bearer', async () => {
    const context = mockExecutionContext({
      headers: { authorization: 'Basic token' },
    });
    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('returns true with dev-token in development when explicitly enabled', async () => {
    const originalEnv = process.env.NODE_ENV;
    const originalDev = process.env.ALLOW_DEV_TOKEN;
    process.env.NODE_ENV = 'development';
    process.env.ALLOW_DEV_TOKEN = 'true';

    const context = mockExecutionContext({
      headers: { authorization: 'Bearer dev-token' },
    });

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(context.switchToHttp().getRequest().user).toEqual({
      id: '11111111-1111-1111-1111-111111111111',
      email: 'demo@bmbuild.com',
      company_id: '77777777-7777-7777-7777-777777777777',
      role: 'admin',
    });

    process.env.NODE_ENV = originalEnv;
    process.env.ALLOW_DEV_TOKEN = originalDev;
  });

  it('verifies Supabase token and attaches user from DB', async () => {
    const mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: {
            user: {
              id: 'user-123',
              email: 'test@example.com',
              user_metadata: { company_id: 'evil-company' },
            },
          },
          error: null,
        }),
      },
    };
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { createClient } = require('@supabase/supabase-js');
    (createClient as jest.Mock).mockReturnValue(mockSupabase);

    usersService.ensureUserFromAuth.mockResolvedValue({
      id: 'user-123',
      email: 'test@example.com',
      name: 'Test',
      role: 'engineer',
      company_id: 'company-456',
    } as any);

    const context = mockExecutionContext({
      headers: { authorization: 'Bearer valid-token' },
    });

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(context.switchToHttp().getRequest().user).toEqual({
      id: 'user-123',
      email: 'test@example.com',
      company_id: 'company-456',
      role: 'engineer',
    });
  });

  it('allows onboarding routes without company_id', async () => {
    const mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: {
            user: {
              id: 'new-user',
              email: 'new@example.com',
              user_metadata: {},
            },
          },
          error: null,
        }),
      },
    };
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { createClient } = require('@supabase/supabase-js');
    (createClient as jest.Mock).mockReturnValue(mockSupabase);

    usersService.ensureUserFromAuth.mockResolvedValue({
      id: 'new-user',
      email: 'new@example.com',
      name: 'New',
      role: 'engineer',
      company_id: null,
    } as any);

    const context = mockExecutionContext({
      headers: { authorization: 'Bearer valid-token' },
      method: 'POST',
      path: '/api/v1/companies',
    });

    const result = await guard.canActivate(context);
    expect(result).toBe(true);
    expect(context.switchToHttp().getRequest().user).toEqual({
      id: 'new-user',
      email: 'new@example.com',
      company_id: undefined,
      role: 'engineer',
    });
  });

  it('blocks non-onboarding routes without company_id', async () => {
    const mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: {
            user: {
              id: 'new-user',
              email: 'new@example.com',
              user_metadata: {},
            },
          },
          error: null,
        }),
      },
    };
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { createClient } = require('@supabase/supabase-js');
    (createClient as jest.Mock).mockReturnValue(mockSupabase);

    usersService.ensureUserFromAuth.mockResolvedValue({
      id: 'new-user',
      email: 'new@example.com',
      name: 'New',
      role: 'engineer',
      company_id: null,
    } as any);

    const context = mockExecutionContext({
      headers: { authorization: 'Bearer valid-token' },
      method: 'GET',
      path: '/api/v1/projects',
    });

    await expect(guard.canActivate(context)).rejects.toThrow(
      ForbiddenException,
    );
  });
});
