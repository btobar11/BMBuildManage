import { Test, TestingModule } from '@nestjs/testing';
import { MachineryController } from './machinery.controller';
import { MachineryService } from './machinery.service';

describe('MachineryController', () => {
  let controller: MachineryController;
  let service: MachineryService;

  const mockMachineryService = {
    create: jest.fn(),
    findAllByCompany: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MachineryController],
      providers: [
        {
          provide: MachineryService,
          useValue: mockMachineryService,
        },
      ],
    }).compile();

    controller = module.get<MachineryController>(MachineryController);
    service = module.get<MachineryService>(MachineryService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /', () => {
    it('should create machinery', async () => {
      const createDto: any = { name: 'Excavator', company_id: 'company-1' };
      const expected = { id: 'machinery-1', ...createDto };
      mockMachineryService.create.mockResolvedValue(expected);

      const result = await controller.create(createDto);

      expect(mockMachineryService.create).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(expected);
    });
  });

  describe('GET /', () => {
    it('should return all machinery by company', async () => {
      const expected = [{ id: 'machinery-1', name: 'Excavator' }];
      mockMachineryService.findAllByCompany.mockResolvedValue(expected);

      const result = await controller.findAll('company-1');

      expect(mockMachineryService.findAllByCompany).toHaveBeenCalledWith(
        'company-1',
      );
      expect(result).toEqual(expected);
    });
  });

  describe('GET /:id', () => {
    it('should return a single machinery', async () => {
      const expected = { id: 'machinery-1', name: 'Excavator' };
      mockMachineryService.findOne.mockResolvedValue(expected);

      const result = await controller.findOne('machinery-1');

      expect(mockMachineryService.findOne).toHaveBeenCalledWith('machinery-1');
      expect(result).toEqual(expected);
    });
  });

  describe('DELETE /:id', () => {
    it('should remove machinery', async () => {
      mockMachineryService.remove.mockResolvedValue({ id: 'machinery-1' });

      const result = await controller.remove('machinery-1');

      expect(mockMachineryService.remove).toHaveBeenCalledWith('machinery-1');
      expect(result).toEqual({ id: 'machinery-1' });
    });
  });
});
