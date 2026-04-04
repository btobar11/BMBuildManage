export class ApiResponseDto<T> {
  success: boolean;
  data: T;
  timestamp: string;

  constructor(data: T) {
    this.success = true;
    this.data = data;
    this.timestamp = new Date().toISOString();
  }
}

export class ApiErrorResponseDto {
  success: boolean;
  statusCode: number;
  message: string | string[];
  timestamp: string;
  path?: string;

  constructor(statusCode: number, message: string | string[], path?: string) {
    this.success = false;
    this.statusCode = statusCode;
    this.message = message;
    this.timestamp = new Date().toISOString();
    this.path = path;
  }
}
