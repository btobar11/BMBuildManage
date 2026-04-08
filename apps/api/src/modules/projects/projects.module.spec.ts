import { ProjectsModule } from './projects.module';
import { ProjectsService } from './projects.service';
import { ProjectsController } from './projects.controller';

describe('ProjectsModule', () => {
  it('should be defined', () => {
    expect(ProjectsModule).toBeDefined();
  });

  it('should have ProjectsService defined', () => {
    expect(ProjectsService).toBeDefined();
  });

  it('should have ProjectsController defined', () => {
    expect(ProjectsController).toBeDefined();
  });
});
