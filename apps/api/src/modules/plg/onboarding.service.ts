import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OnboardingProgress } from './entities/onboarding-progress.entity';

export const ONBOARDING_STEPS = [
  'create_project',
  'create_budget',
  'add_item',
  'add_expense',
  'invite_user',
  'upload_document',
] as const;

export type OnboardingStepCode = (typeof ONBOARDING_STEPS)[number];

export interface OnboardingStatus {
  total_steps: number;
  completed_steps: number;
  percentage: number;
  steps: { code: string; completed: boolean; completed_at?: Date }[];
}

@Injectable()
export class OnboardingService {
  private readonly logger = new Logger(OnboardingService.name);

  constructor(
    @InjectRepository(OnboardingProgress)
    private readonly onboardingRepo: Repository<OnboardingProgress>,
  ) {}

  /**
   * Mark a specific onboarding step as completed for a user/company.
   * Safe to call multiple times (idempotent).
   */
  async completeStep(
    companyId: string,
    userId: string,
    stepCode: OnboardingStepCode,
  ): Promise<void> {
    if (!ONBOARDING_STEPS.includes(stepCode)) {
      this.logger.warn(`Invalid onboarding step code: ${stepCode}`);
      return;
    }

    try {
      const existing = await this.onboardingRepo.findOne({
        where: { company_id: companyId, user_id: userId, step_code: stepCode },
      });

      if (!existing) {
        const newProgress = this.onboardingRepo.create({
          company_id: companyId,
          user_id: userId,
          step_code: stepCode,
          completed: true,
          completed_at: new Date(),
        });
        await this.onboardingRepo.save(newProgress);
        this.logger.log(
          `User ${userId} completed onboarding step: ${stepCode}`,
        );
      } else if (!existing.completed) {
        existing.completed = true;
        existing.completed_at = new Date();
        await this.onboardingRepo.save(existing);
      }
    } catch (error) {
      this.logger.error(
        `Error completing onboarding step ${stepCode}`,
        error.stack,
      );
    }
  }

  /**
   * Get the overall onboarding progress for a company.
   * Assumes we want the company-wide progress (if any user completed the step, it's done for the company).
   */
  async getProgress(companyId: string): Promise<OnboardingStatus> {
    const progressRecords = await this.onboardingRepo.find({
      where: { company_id: companyId },
    });

    const steps = ONBOARDING_STEPS.map((code) => {
      const record = progressRecords.find(
        (r) => r.step_code === code && r.completed,
      );
      return {
        code,
        completed: !!record,
        completed_at: record?.completed_at,
      };
    });

    const completedSteps = steps.filter((s) => s.completed).length;
    const totalSteps = ONBOARDING_STEPS.length;

    return {
      total_steps: totalSteps,
      completed_steps: completedSteps,
      percentage:
        totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0,
      steps,
    };
  }
}
