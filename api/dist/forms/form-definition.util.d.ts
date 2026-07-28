import type { FormVersionDefinition } from "@hatef/contracts";
import { PrismaService } from "../prisma/prisma.service";
/** Assembles the full page→section→field→option tree + rules for one FormVersion, shared by the admin builder and the partner wizard. */
export declare function assembleFormVersionDefinition(prisma: PrismaService, formVersionId: string): Promise<FormVersionDefinition>;
//# sourceMappingURL=form-definition.util.d.ts.map