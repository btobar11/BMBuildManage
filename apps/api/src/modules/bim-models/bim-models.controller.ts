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
  BadRequestException,
  Request,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { BimModelsService } from './bim-models.service';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';

@Controller('bim/models')
@UseGuards(SupabaseAuthGuard)
export class BimModelsController {
  constructor(private readonly service: BimModelsService) {}

  @Get()
  async getModels(@Query('projectId') projectId?: string, @Request() req: any) {
    if (!projectId) {
      return [];
    }
    const { company_id } = req.user;
    return this.service.getModelsByProject(projectId, company_id);
  }

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async uploadModel(
    @UploadedFile() file: Express.Multer.File,
    @Body('projectId') projectId: string,
    @Request() req: any,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    
    if (!projectId) {
      throw new BadRequestException('Project ID is required');
    }
    
    if (!file.originalname.match(/\.(ifc|ifcxml)$/i)) {
      throw new BadRequestException('Only IFC files are allowed');
    }

    const { company_id } = req.user;

    try {
      return await this.service.uploadModel(projectId, file);
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Upload failed'
      );
    }
  }

  @Delete(':id')
  async deleteModel(@Param('id') id: string, @Request() req: any) {
    const { company_id } = req.user;
    return this.service.deleteModel(id, company_id);
  }
}
