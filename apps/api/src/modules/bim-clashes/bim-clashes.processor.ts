import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { BimClashesService } from './bim-clashes.service';
import { CLASH_DETECTION_QUEUE } from './constants';

@Processor(CLASH_DETECTION_QUEUE)
@Injectable()
export class BimClashesProcessor extends WorkerHost {
  private readonly logger = new Logger(BimClashesProcessor.name);

  constructor(private readonly bimClashesService: BimClashesService) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.log(`Processing clash detection job ${job.id}`);

    try {
      const { jobId, companyId } = job.data;

      // Update job to running (the service will do this too, but we can do it here for federated jobs)
      if (job.name === 'federated-clash') {
        this.logger.log(
          `Starting federated clash detection for DB Job ID: ${jobId}`,
        );
        await this.bimClashesService.processFederatedClashDetection(jobId);
      } else {
        this.logger.log(
          `Starting standard clash detection for DB Job ID: ${jobId}`,
        );
        await this.bimClashesService.runClashDetection(jobId);
      }

      this.logger.log(`Successfully completed clash detection job ${job.id}`);
      return { success: true };
    } catch (error) {
      this.logger.error(
        `Error processing clash detection job ${job.id}:`,
        error,
      );
      throw error;
    }
  }
}
