import { ClientsModule } from './clients.module';
import { ClientsService } from './clients.service';
import { ClientsController } from './clients.controller';

describe('ClientsModule', () => {
  it('should be defined', () => {
    expect(ClientsModule).toBeDefined();
  });

  it('should have ClientsService defined', () => {
    expect(ClientsService).toBeDefined();
  });

  it('should have ClientsController defined', () => {
    expect(ClientsController).toBeDefined();
  });
});
