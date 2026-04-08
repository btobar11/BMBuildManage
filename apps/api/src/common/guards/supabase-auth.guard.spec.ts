import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
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
  let configService: jest.Mocked<ConfigService>;
  let usersService: jest.Mocked<UsersService>;

  const mockExecutionContext = (headers: Record<string, string> = {}) => {
    const request = { headers, user: null };
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
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<SupabaseAuthGuard>(SupabaseAuthGuard);
    configService = module.get(ConfigService);
    usersService = module.get(UsersService);
  });

  describe('canActivate', () => {
    it('should throw UnauthorizedException when no authorization header', async () => {
      const context = mockExecutionContext({});

      await expect(guard.canActivate(context)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException when authorization header is array', async () => {
      const context = {
        switchToHttp: () => ({
          getRequest: () => ({
            headers: { authorization: ['Bearer token'] },
            user: null,
          }),
        }),
      } as any;

      await expect(guard.canActivate(context)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException when token does not start with Bearer', async () => {
      const context = mockExecutionContext({ authorization: 'Basic token' });

      await expect(guard.canActivate(context)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should return true with dev-token in development', async () => {
      const originalEnv = process.env.NODE_ENV;
      const originalDev = process.env.ALLOW_DEV_TOKEN;
      process.env.NODE_ENV = 'development';
      process.env.ALLOW_DEV_TOKEN = 'true';

      const context = mockExecutionContext({
        authorization: 'Bearer dev-token',
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

    it('should verify Supabase token and extract user data', async () => {
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: {
              user: {
                id: 'user-123',
                email: 'test@example.com',
                user_metadata: { company_id: 'company-123' },
              },
            },
            error: null,
          }),
        },
      };
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { createClient } = require('@supabase/supabase-js');
      (createClient as jest.Mock).mockReturnValue(mockSupabase);

      usersService.findOne.mockResolvedValue({
        id: 'user-123',
        role: 'user',
        company_id: 'company-456',
      } as any);

      const context = mockExecutionContext({
        authorization: 'Bearer valid-token',
      });

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(context.switchToHttp().getRequest().user).toEqual({
        id: 'user-123',
        email: 'test@example.com',
        company_id: 'company-456',
        role: 'user',
      });
    });

    it('should throw UnauthorizedException when token is invalid', async () => {
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: null },
            error: new Error('Invalid token'),
          }),
        },
      };
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { createClient } = require('@supabase/supabase-js');
      (createClient as jest.Mock).mockReturnValue(mockSupabase);

      const context = mockExecutionContext({
        authorization: 'Bearer invalid-token',
      });

      await expect(guard.canActivate(context)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should use default role when user not in database', async () => {
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: {
              user: {
                id: 'new-user',
                email: 'new@example.com',
                user_metadata: { company_id: 'company-123' },
              },
            },
            error: null,
          }),
        },
      };
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { createClient } = require('@supabase/supabase-js');
      (createClient as jest.Mock).mockReturnValue(mockSupabase);

      usersService.findOne.mockRejectedValue(new Error('Not found'));

      const context = mockExecutionContext({
        authorization: 'Bearer new-user-token',
      });

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(context.switchToHttp().getRequest().user).toEqual({
        id: 'new-user',
        email: 'new@example.com',
        company_id: 'company-123',
        role: 'admin',
      });
    });
  });
});
