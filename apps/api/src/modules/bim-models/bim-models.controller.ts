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
  async getModels(@Request() req: any, @Query('projectId') projectId?: string) {
    if (!projectId) {
      return [];
    }
    const { company_id } = req.user;
    return this.service.getModelsByProject(projectId, company_id);
  }

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async uploadModel(
    @UploadedFile() file: any,
    @Body('projectId') projectId: string,
    @Request() req: any,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    if (!projectId) {
      throw new BadRequestException('Project ID is required');
    }

    // Check file extension and provide appropriate guidance
    const fileExtension = file.originalname.toLowerCase();
    
    if (fileExtension.endsWith('.dwg')) {
      throw new BadRequestException({
        message: 'AutoCAD .DWG files detected',
        guidance: 'Please export your .DWG file as .IFC from AutoCAD using: File > Export > IFC',
        supportedFormats: ['.ifc', '.ifcxml'],
        detectedFormat: '.dwg'
      });
    }
    
    if (fileExtension.endsWith('.rvt')) {
      throw new BadRequestException({
        message: 'Revit .RVT files detected',
        guidance: 'Please export your .RVT file as .IFC from Revit using: File > Export > IFC',
        supportedFormats: ['.ifc', '.ifcxml'],
        detectedFormat: '.rvt'
      });
    }

    if (!file.originalname.match(/\.(ifc|ifcxml)$/i)) {
      throw new BadRequestException({
        message: 'Unsupported file format',
        guidance: 'Please upload files in supported BIM formats',
        supportedFormats: ['.ifc', '.ifcxml'],
        detectedFormat: file.originalname.split('.').pop()
      });
    }

    const { company_id } = req.user;

    try {
      return await this.service.uploadModel(projectId, file);
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Upload failed',
      );
    }
  }

  @Delete(':id')
  async deleteModel(@Param('id') id: string, @Request() req: any) {
    const { company_id } = req.user;
    return this.service.deleteModel(id, company_id);
  }
}
