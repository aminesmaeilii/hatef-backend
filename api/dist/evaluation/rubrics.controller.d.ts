import { z } from "zod";
import { RubricsService } from "./rubrics.service";
declare const createRubricSchema: z.ZodObject<{
    key: z.ZodString;
    title: z.ZodString;
    criteria: z.ZodArray<z.ZodObject<{
        key: z.ZodString;
        label: z.ZodString;
        maxScore: z.ZodNumber;
        weight: z.ZodNumber;
    }, z.core.$strip>>;
}, z.core.$strip>;
export declare class RubricsController {
    private readonly rubrics;
    constructor(rubrics: RubricsService);
    list(): Promise<{
        id: string;
        key: string;
        versionNumber: number;
        title: string;
        criteria: {
            key: string;
            label: string;
            maxScore: number;
            weight: number;
        }[];
        status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
    }[]>;
    create(body: z.infer<typeof createRubricSchema>): Promise<{
        id: string;
        key: string;
        versionNumber: number;
        title: string;
        criteria: {
            key: string;
            label: string;
            maxScore: number;
            weight: number;
        }[];
        status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
    }>;
    publish(rubricId: string): Promise<{
        id: string;
        key: string;
        versionNumber: number;
        title: string;
        criteria: {
            key: string;
            label: string;
            maxScore: number;
            weight: number;
        }[];
        status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
    }>;
}
export {};
//# sourceMappingURL=rubrics.controller.d.ts.map