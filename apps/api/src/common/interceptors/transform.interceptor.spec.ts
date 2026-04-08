import { Test, TestingModule } from '@nestjs/testing';
import { TransformInterceptor, ApiResponse } from './transform.interceptor';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable, of } from 'rxjs';

describe('TransformInterceptor', () => {
  let interceptor: TransformInterceptor<any>;

  const createMockContext = () =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({}),
      }),
    }) as unknown as ExecutionContext;

  const createMockHandler = (data: any): CallHandler => ({
    handle: () => of(data),
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TransformInterceptor],
    }).compile();

    interceptor = module.get<TransformInterceptor<any>>(TransformInterceptor);
  });

  describe('intercept', () => {
    it('should return an observable', () => {
      const context = createMockContext();
      const next = createMockHandler({});

      const result = interceptor.intercept(context, next);

      expect(result).toBeInstanceOf(Observable);
    });

    it('should wrap data in ApiResponse format', (done) => {
      const context = createMockContext();
      const next = createMockHandler({ id: '123', name: 'Test' });

      interceptor
        .intercept(context, next)
        .subscribe((result: ApiResponse<any>) => {
          expect(result).toEqual({
            success: true,
            data: { id: '123', name: 'Test' },
            timestamp: expect.any(String),
          });
          done();
        });
    });

    it('should add success: true to response', (done) => {
      const context = createMockContext();
      const next = createMockHandler({ data: 'test' });

      interceptor
        .intercept(context, next)
        .subscribe((result: ApiResponse<any>) => {
          expect(result.success).toBe(true);
          done();
        });
    });

    it('should add ISO timestamp to response', (done) => {
      const context = createMockContext();
      const next = createMockHandler({});

      interceptor
        .intercept(context, next)
        .subscribe((result: ApiResponse<any>) => {
          expect(result.timestamp).toBeDefined();
          const date = new Date(result.timestamp);
          expect(date.getTime()).not.toBeNaN();
          done();
        });
    });

    it('should handle null data', (done) => {
      const context = createMockContext();
      const next = createMockHandler(null);

      interceptor
        .intercept(context, next)
        .subscribe((result: ApiResponse<any>) => {
          expect(result.data).toBeNull();
          expect(result.success).toBe(true);
          done();
        });
    });

    it('should handle array data', (done) => {
      const context = createMockContext();
      const next = createMockHandler([{ id: '1' }, { id: '2' }]);

      interceptor
        .intercept(context, next)
        .subscribe((result: ApiResponse<any>) => {
          expect(result.data).toEqual([{ id: '1' }, { id: '2' }]);
          expect(Array.isArray(result.data)).toBe(true);
          done();
        });
    });

    it('should handle empty object', (done) => {
      const context = createMockContext();
      const next = createMockHandler({});

      interceptor
        .intercept(context, next)
        .subscribe((result: ApiResponse<any>) => {
          expect(result).toEqual({
            success: true,
            data: {},
            timestamp: expect.any(String),
          });
          done();
        });
    });

    it('should preserve original data structure', (done) => {
      const context = createMockContext();
      const originalData = {
        users: [
          { id: '1', name: 'John', role: 'admin' },
          { id: '2', name: 'Jane', role: 'user' },
        ],
        pagination: { page: 1, total: 2 },
      };
      const next = createMockHandler(originalData);

      interceptor
        .intercept(context, next)
        .subscribe((result: ApiResponse<any>) => {
          expect(result.data).toEqual(originalData);
          done();
        });
    });
  });
});
