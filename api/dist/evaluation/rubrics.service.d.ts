import type { EvaluationRubric, RubricCriterion } from "@hatef/contracts";
import { PrismaService } from "../prisma/prisma.service";
export declare class RubricsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(input: {
        key: string;
        title: string;
        criteria: RubricCriterion[];
    }): Promise<EvaluationRubric>;
    publish(rubricId: string): Promise<EvaluationRubric>;
    listPublished(): Promise<EvaluationRubric[]>;
    getPublishedByKey(key: string): Promise<EvaluationRubric>;
    private toDto;
}
//# sourceMappingURL=rubrics.service.d.ts.map