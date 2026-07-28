import { type PipeTransform } from "@nestjs/common";
import type { ZodType } from "zod";
export declare class ZodValidationPipe implements PipeTransform {
    private readonly schema;
    constructor(schema: ZodType);
    transform(value: unknown): unknown;
}
//# sourceMappingURL=zod-validation.pipe.d.ts.map