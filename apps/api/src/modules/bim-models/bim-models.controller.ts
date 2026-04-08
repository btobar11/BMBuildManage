import {
  Controller,
  Get,
  Post,
  Delete,
  Query,
  Param,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { BimModelsService } from './bim-models.service';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';

@Controller('bim/models')
@UseGuards(SupabaseAuthGuard)
export class BimModelsController {
  constructor(private readonly service: BimModelsService) {}

  @Get()
  async getModels(@Query('projectId') projectId: string) {
    return this.service.getModelsByProject(projectId);
  }

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async uploadModel(
    @UploadedFile() file: Express.Multer.File,
    @Body('projectId') projectId: string,
  ) {
    if (!file) {
      throw new Error('No file uploaded');
    }
    
    if (!file.originalname.match(/\.(ifc|ifcxml)$/i)) {
      throw new Error('Only IFC files are allowed');
    }

    return this.service.uploadModel(projectId, file);
  }

  @Delete(':id')
  async deleteModel(@Param('id') id: string) {
    return this.service.deleteModel(id);
  }
}
