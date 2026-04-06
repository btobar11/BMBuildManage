import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { ApuTemplate } from './apu-template.entity';
import { Resource, ResourceType } from '../resources/resource.entity';

@Entity('apu_resources')
@Index(['apu_id'])
export class ApuResource {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  apu_id: string;

  @ManyToOne(() => ApuTemplate, (apu) => apu.apu_resources, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'apu_id' })
  apu_template: ApuTemplate;

  @Column()
  resource_id: string;

  @ManyToOne(() => Resource, { eager: true })
  @JoinColumn({ name: 'resource_id' })
  resource: Resource;

  @Column({ type: 'enum', enum: ResourceType })
  resource_type: ResourceType;

  /**
   * Coefficient = how much of this resource per base unit of the APU.
   * Example: concrete 0.10 m³/m² means 0.10 m³ of concrete per 1 m² of radier.
   */
  @Column({ type: 'decimal', precision: 12, scale: 5, default: 1 })
  coefficient: number;
}
