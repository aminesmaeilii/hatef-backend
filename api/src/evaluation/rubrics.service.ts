import { Injectable, NotFoundException } from "@nestjs/common";
import type { EvaluationRubric, RubricCriterion } from "@hatef/contracts";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class RubricsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: { key: string; title: string; criteria: RubricCriterion[] }): Promise<EvaluationRubric> {
    const latest = await this.prisma.evaluationRubric.findFirst({
      where: { key: input.key },
      orderBy: { versionNumber: "desc" },
    });
    const rubric = await this.prisma.evaluationRubric.create({
      data: {
        key: input.key,
        versionNumber: (latest?.versionNumber ?? 0) + 1,
        title: input.title,
        criteria: input.criteria as never,
        status: "DRAFT",
      },
    });
    return this.toDto(rubric);
  }

  async publish(rubricId: string): Promise<EvaluationRubric> {
    const rubric = await this.prisma.evaluationRubric.findUniqueOrThrow({ where: { id: rubricId } });

    await this.prisma.$transaction([
      this.prisma.evaluationRubric.updateMany({
        where: { key: rubric.key, status: "PUBLISHED" },
        data: { status: "ARCHIVED" },
      }),
      this.prisma.evaluationRubric.update({
        where: { id: rubricId },
        data: { status: "PUBLISHED", publishedAt: new Date() },
      }),
    ]);

    return this.toDto({ ...rubric, status: "PUBLISHED" });
  }

  async listPublished(): Promise<EvaluationRubric[]> {
    const rubrics = await this.prisma.evaluationRubric.findMany({ where: { status: "PUBLISHED" } });
    return rubrics.map((r) => this.toDto(r));
  }

  async getPublishedByKey(key: string): Promise<EvaluationRubric> {
    const rubric = await this.prisma.evaluationRubric.findFirst({ where: { key, status: "PUBLISHED" } });
    if (!rubric) throw new NotFoundException("سیاهه ارزیابی منتشرشده‌ای یافت نشد.");
    return this.toDto(rubric);
  }

  private toDto(rubric: {
    id: string;
    key: string;
    versionNumber: number;
    title: string;
    criteria: unknown;
    status: string;
  }): EvaluationRubric {
    return {
      id: rubric.id,
      key: rubric.key,
      versionNumber: rubric.versionNumber,
      title: rubric.title,
      criteria: rubric.criteria as RubricCriterion[],
      status: rubric.status as EvaluationRubric["status"],
    };
  }
}
