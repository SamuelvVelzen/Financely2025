import { prisma } from "@/features/util/prisma";

/**
 * Response type for wizard progress
 */
export interface IWizardProgressResponse {
  wizardId: string;
  currentStepIndex: number;
  totalSteps: number;
  completed: boolean;
  completedAt: string | null;
  percentComplete: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Wizard Service
 * Handles wizard progress tracking and completion status
 */
export class WizardService {
  /**
   * Get progress for a specific wizard
   */
  static async getWizardProgress(
    userId: string,
    wizardId: string
  ): Promise<IWizardProgressResponse | null> {
    const progress = await prisma.wizardProgress.findUnique({
      where: {
        userId_wizardId: {
          userId,
          wizardId,
        },
      },
    });

    if (!progress) {
      return null;
    }

    return this.parseWizardProgress(progress);
  }

  /**
   * Update progress for a wizard (upsert)
   */
  static async updateWizardProgress(
    userId: string,
    wizardId: string,
    currentStepIndex: number,
    totalSteps: number
  ): Promise<IWizardProgressResponse> {
    const progress = await prisma.wizardProgress.upsert({
      where: {
        userId_wizardId: {
          userId,
          wizardId,
        },
      },
      update: {
        currentStepIndex,
        totalSteps,
      },
      create: {
        userId,
        wizardId,
        currentStepIndex,
        totalSteps,
        completed: false,
      },
    });

    return this.parseWizardProgress(progress);
  }

  /**
   * Mark a wizard as completed
   */
  static async completeWizard(
    userId: string,
    wizardId: string
  ): Promise<IWizardProgressResponse> {
    // First, get the current progress to get totalSteps
    const existing = await prisma.wizardProgress.findUnique({
      where: {
        userId_wizardId: {
          userId,
          wizardId,
        },
      },
    });

    const progress = await prisma.wizardProgress.upsert({
      where: {
        userId_wizardId: {
          userId,
          wizardId,
        },
      },
      update: {
        completed: true,
        completedAt: new Date(),
        currentStepIndex: existing?.totalSteps ?? 1,
      },
      create: {
        userId,
        wizardId,
        currentStepIndex: 1,
        totalSteps: 1,
        completed: true,
        completedAt: new Date(),
      },
    });

    return this.parseWizardProgress(progress);
  }

  /**
   * Check if a wizard is completed
   */
  static async isWizardCompleted(
    userId: string,
    wizardId: string
  ): Promise<boolean> {
    const progress = await prisma.wizardProgress.findUnique({
      where: {
        userId_wizardId: {
          userId,
          wizardId,
        },
      },
      select: {
        completed: true,
      },
    });

    return progress?.completed ?? false;
  }

  /**
   * Get all wizard progress for a user
   */
  static async getAllWizardProgress(
    userId: string
  ): Promise<IWizardProgressResponse[]> {
    const progressList = await prisma.wizardProgress.findMany({
      where: {
        userId,
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    return progressList.map((progress) => this.parseWizardProgress(progress));
  }

  /**
   * Parse wizard progress from database format to API format
   */
  private static parseWizardProgress(progress: {
    id: string;
    userId: string;
    wizardId: string;
    currentStepIndex: number;
    totalSteps: number;
    completed: boolean;
    completedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }): IWizardProgressResponse {
    const percentComplete =
      progress.totalSteps > 0
        ? Math.round((progress.currentStepIndex / progress.totalSteps) * 100)
        : 0;

    return {
      wizardId: progress.wizardId,
      currentStepIndex: progress.currentStepIndex,
      totalSteps: progress.totalSteps,
      completed: progress.completed,
      completedAt: progress.completedAt
        ? progress.completedAt.toISOString()
        : null,
      percentComplete: progress.completed ? 100 : percentComplete,
      createdAt: progress.createdAt.toISOString(),
      updatedAt: progress.updatedAt.toISOString(),
    };
  }
}
