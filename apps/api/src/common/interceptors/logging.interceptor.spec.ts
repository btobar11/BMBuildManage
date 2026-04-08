import { Test, TestingModule } from '@nestjs/testing';
import { LoggingInterceptor } from './logging.interceptor';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable, of } from 'rxjs';

describe('LoggingInterceptor', () => {
  let interceptor: LoggingInterceptor;

  const createMockContext = (
    method: string = 'GET',
    url: string = '/api/test',
    statusCode: number = 200,
  ) => {
    const mockRequest = { method, url };
    const mockResponse = { statusCode };

    return {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
        getResponse: () => mockResponse,
      }),
    } as unknown as ExecutionContext;
  };

  const createMockHandler = (): CallHandler => ({
    handle: () => of({ data: 'test' }),
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LoggingInterceptor],
    }).compile();

    interceptor = module.get<LoggingInterceptor>(LoggingInterceptor);
  });

  describe('intercept', () => {
    it('should return an observable', () => {
      const context = createMockContext();
      const next = createMockHandler();

      const result = interceptor.intercept(context, next);

      expect(result).toBeInstanceOf(Observable);
    });

    it('should wrap response in success response', (done) => {
      const context = createMockContext('GET', '/api/test', 200);
      const next = createMockHandler();

      interceptor.intercept(context, next).subscribe((result) => {
        expect(result).toEqual({ data: 'test' });
        done();
      });
    });

    it('should log request with method, url, status and duration', (done) => {
      const context = createMockContext('POST', '/api/projects', 201);
      const next = createMockHandler();

      const loggerSpy = jest.spyOn((interceptor as any).logger, 'log');

      interceptor.intercept(context, next).subscribe(() => {
        expect(loggerSpy).toHaveBeenCalled();
        const logCall = loggerSpy.mock.calls[0][0] as string;
        expect(logCall).toContain('POST');
        expect(logCall).toContain('/api/projects');
        expect(logCall).toContain('201');
        expect(logCall).toContain('ms');
        done();
      });
    });

    it('should handle different HTTP methods', (done) => {
      const context = createMockContext('PUT', '/api/items/123', 204);
      const next = createMockHandler();

      const loggerSpy = jest.spyOn((interceptor as any).logger, 'log');

      interceptor.intercept(context, next).subscribe(() => {
        expect(loggerSpy).toHaveBeenCalledWith(expect.stringContaining('PUT'));
        done();
      });
    });

    it('should calculate response time', (done) => {
      const context = createMockContext('GET', '/api/test', 200);
      const next = {
        handle: () =>
          new Observable((subscriber) => {
            setTimeout(() => {
              subscriber.next({ result: 'slow' });
              subscriber.complete();
            }, 50);
          }),
      };

      const loggerSpy = jest.spyOn((interceptor as any).logger, 'log');

      interceptor.intercept(context, next).subscribe(() => {
        const logCall = loggerSpy.mock.calls[0][0] as string;
        const durationMatch = logCall.match(/(\d+)ms/);
        expect(durationMatch).not.toBeNull();
        expect(parseInt(durationMatch![1], 10)).toBeGreaterThanOrEqual(40);
        done();
      });
    });

    it('should capture correct status code from response', (done) => {
      const context = createMockContext('DELETE', '/api/test/1', 404);
      const next = createMockHandler();

      const loggerSpy = jest.spyOn((interceptor as any).logger, 'log');

      interceptor.intercept(context, next).subscribe(() => {
        expect(loggerSpy).toHaveBeenCalledWith(expect.stringContaining('404'));
        done();
      });
    });
  });
});
