import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProjectModel } from './project-model.entity';
import { createClient } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class BimModelsService {
  private supabase;

  constructor(
    @InjectRepository(ProjectModel)
    private readonly modelRepository: Repository<ProjectModel>,
    private readonly configService: ConfigService,
  ) {
    this.supabase = createClient(
      this.configService.get<string>('SUPABASE_URL') || '',
      this.configService.get<string>('SUPABASE_ANON_KEY') || '',
    );
  }

  async getModelsByProject(projectId: string, companyId: string) {
    return this.modelRepository.find({
      where: {
        project_id: projectId,
        company_id: companyId,
      },
      order: { created_at: 'DESC' },
    });
  }

  async createModel(projectId: string, data: Partial<ProjectModel>) {
    const model = this.modelRepository.create({
      project_id: projectId,
      ...data,
    });
    return this.modelRepository.save(model);
  }

  /**
   * Detect and validate file format for BIM processing
   */
  detectBIMFormat(filename: string): { format: string; supported: boolean; guidance?: string } {
    const extension = filename.toLowerCase().split('.').pop();
    
    switch (extension) {
      case 'ifc':
        return { format: 'IFC', supported: true };
      case 'ifcxml':
        return { format: 'IFCXML', supported: true };
      case 'dwg':
        return { 
          format: 'DWG', 
          supported: false, 
          guidance: 'Export as .IFC from AutoCAD: File > Export > IFC' 
        };
      case 'rvt':
        return { 
          format: 'RVT', 
          supported: false, 
          guidance: 'Export as .IFC from Revit: File > Export > IFC' 
        };
      case '3dm':
        return { 
          format: '3DM', 
          supported: false, 
          guidance: 'Export as .IFC from Rhino using IFC export plugins' 
        };
      case 'skp':
        return { 
          format: 'SKP', 
          supported: false, 
          guidance: 'Export as .IFC from SketchUp using IFC extension' 
        };
      default:
        return { 
          format: extension?.toUpperCase() || 'UNKNOWN', 
          supported: false, 
          guidance: 'Please use supported BIM formats: .IFC or .IFCXML' 
        };
    }
  }

  /**
   * Get conversion guidance for non-IFC formats
   */
  getConversionGuidance(format: string): string {
    const guides: Record<string, string> = {
      DWG: '1. Open AutoCAD\n2. Go to File > Export > IFC\n3. Select IFC4 format\n4. Upload the .ifc file',
      RVT: '1. Open Revit\n2. Go to File > Export > IFC\n3. Configure IFC export settings\n4. Upload the .ifc file',
      SKP: '1. Install IFC extension in SketchUp\n2. Use Extensions > IFC > Export\n3. Upload the .ifc file',
      '3DM': '1. Use Rhino IFC export plugin\n2. Export as IFC format\n3. Upload the .ifc file'
    };
    
    return guides[format] || 'Please convert to .IFC format using your BIM software';
  }

  async uploadModel(projectId: string, file: any) {
    try {
      // Get project to find company_id
      const project = await this.modelRepository.manager.query(
        'SELECT company_id FROM projects WHERE id = $1',
        [projectId],
      );

      if (!project.length) {
        throw new Error('Project not found');
      }

      const companyId = project[0].company_id;

      // Upload file to Supabase Storage with company isolation
      const fileName = `${Date.now()}_${file.originalname}`;
      const storagePath = `${companyId}/models/${fileName}`;

      const { data: uploadData, error: uploadError } =
        await this.supabase.storage
          .from('bim-models')
          .upload(storagePath, file.buffer, {
            contentType: file.mimetype,
          });

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      // Get public URL
      const { data: urlData } = this.supabase.storage
        .from('bim-models')
        .getPublicUrl(storagePath);

      // Save to database
      const model = this.modelRepository.create({
        project_id: projectId,
        company_id: companyId,
        name: file.originalname.replace(/\.(ifc|ifcxml)$/i, ''),
        storage_path: storagePath,
        file_url: urlData.publicUrl,
        file_size: file.size,
        format: file.originalname.endsWith('.ifcxml') ? 'IFCXML' : 'IFC',
        processing_status: 'pending',
        created_at: new Date(),
        updated_at: new Date(),
      });

      const savedModel = await this.modelRepository.save(model);

      // TODO: Trigger IFC processing pipeline
      this.processIfcFile(savedModel.id, urlData.publicUrl);

      return {
        success: true,
        model: savedModel,
        message:
          'Archivo IFC subido exitosamente. El procesamiento iniciará en breve.',
      };
    } catch (error) {
      throw new Error(`Error uploading IFC file: ${error.message}`);
    }
  }

  private async processIfcFile(modelId: string, fileUrl: string) {
    // TODO: Implement IFC processing with IFC.js or similar
    // For now, just mark as completed after delay
    setTimeout(() => {
      this.modelRepository
        .update(modelId, {
          processing_status: 'completed',
          updated_at: new Date(),
        })
        .catch(() => {});
    }, 5000);
  }

  async deleteModel(modelId: string, companyId: string) {
    const model = await this.modelRepository.findOne({
      where: {
        id: modelId,
        company_id: companyId,
      },
    });
    if (!model) throw new NotFoundException('Modelo no encontrado');

    // Delete from storage if exists
    if (model.storage_path) {
      await this.supabase.storage
        .from('bim-models')
        .remove([model.storage_path]);
    }

    await this.modelRepository.remove(model);
    return { success: true };
  }
}
