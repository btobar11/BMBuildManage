import { Test, TestingModule } from '@nestjs/testing';
import {
  HttpException,
  HttpStatus,
  BadRequestException,
  UnauthorizedException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { AllExceptionsFilter } from './all-exceptions.filter';

describe('AllExceptionsFilter', () => {
  let filter: AllExceptionsFilter;

  const mockResponse = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };

  const mockRequest = {
    url: '/api/test',
    method: 'GET',
  };

  const createMockHost = (exception: unknown) => {
    return {
      switchToHttp: () => ({
        getResponse: () => mockResponse,
        getRequest: () => mockRequest,
      }),
    } as any;
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [AllExceptionsFilter],
    }).compile();

    filter = module.get<AllExceptionsFilter>(AllExceptionsFilter);
  });

  describe('catch', () => {
    it('should handle HttpException with custom status', () => {
      const exception = new BadRequestException('Bad request');

      filter.catch(exception, createMockHost(exception));

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 400,
          message: 'Bad request',
          path: '/api/test',
          method: 'GET',
        }),
      );
    });

    it('should handle HttpException with standard status', () => {
      const exception = new UnauthorizedException('Unauthorized');

      filter.catch(exception, createMockHost(exception));

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 401,
          message: 'Unauthorized',
        }),
      );
    });

    it('should handle HttpException with message from getResponse', () => {
      const exception = new ForbiddenException('Access denied');

      filter.catch(exception, createMockHost(exception));

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 403,
          message: 'Access denied',
        }),
      );
    });

    it('should handle NotFoundException', () => {
      const exception = new NotFoundException('Not found');

      filter.catch(exception, createMockHost(exception));

      expect(mockResponse.status).toHaveBeenCalledWith(404);
    });

    it('should handle generic Error with 500 status', () => {
      const exception = new Error('Internal error');

      filter.catch(exception, createMockHost(exception));

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 500,
          message: 'Internal error',
        }),
      );
    });

    it('should handle non-Error exceptions with 500 status', () => {
      const exception = 'Unknown error string';

      filter.catch(exception, createMockHost(exception));

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 500,
          message: 'Internal server error',
        }),
      );
    });

    it('should include timestamp in response', () => {
      const exception = new Error('Test');

      filter.catch(exception, createMockHost(exception));

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          timestamp: expect.any(String),
        }),
      );
    });

    it('should include path and method in response', () => {
      const exception = new HttpException('Error', HttpStatus.BAD_GATEWAY);
      mockRequest.url = '/api/v1/projects';
      mockRequest.method = 'POST';

      filter.catch(exception, createMockHost(exception));

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          path: '/api/v1/projects',
          method: 'POST',
        }),
      );
    });
  });
});
