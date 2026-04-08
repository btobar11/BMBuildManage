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
      this.configService.get('SUPABASE_URL'),
      this.configService.get('SUPABASE_ANON_KEY'),
    );
  }

  async getModelsByProject(projectId: string) {
    return this.modelRepository.find({
      where: { project_id: projectId },
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

  async uploadModel(projectId: string, file: Express.Multer.File) {
    try {
      // Upload file to Supabase Storage
      const fileName = `${Date.now()}_${file.originalname}`;
      const { data: uploadData, error: uploadError } = await this.supabase.storage
        .from('bim-models')
        .upload(`models/${fileName}`, file.buffer, {
          contentType: file.mimetype,
        });

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      // Get public URL
      const { data: urlData } = this.supabase.storage
        .from('bim-models')
        .getPublicUrl(`models/${fileName}`);

      // Save to database
      const model = this.modelRepository.create({
        project_id: projectId,
        name: file.originalname.replace(/\.(ifc|ifcxml)$/i, ''),
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
        message: 'Archivo IFC subido exitosamente. El procesamiento iniciará en breve.',
      };
    } catch (error) {
      throw new Error(`Error uploading IFC file: ${error.message}`);
    }
  }

  private async processIfcFile(modelId: string, fileUrl: string) {
    // TODO: Implement IFC processing with IFC.js or similar
    // For now, just mark as completed after delay
    setTimeout(async () => {
      await this.modelRepository.update(modelId, {
        processing_status: 'completed',
        updated_at: new Date(),
      });
    }, 5000);
  }

  async deleteModel(modelId: string) {
    const model = await this.modelRepository.findOne({
      where: { id: modelId },
    });
    if (!model) throw new NotFoundException('Modelo no encontrado');
    
    // Delete from storage if exists
    if (model.file_url) {
      const fileName = model.file_url.split('/').pop();
      await this.supabase.storage
        .from('bim-models')
        .remove([`models/${fileName}`]);
    }
    
    await this.modelRepository.remove(model);
    return { success: true };
  }
}
