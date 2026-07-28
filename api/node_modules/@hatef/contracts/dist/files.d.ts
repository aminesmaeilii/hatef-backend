import { z } from "zod";
export declare const fileAssetSchema: z.ZodObject<{
    id: z.ZodString;
    originalName: z.ZodString;
    mimeType: z.ZodString;
    sizeBytes: z.ZodNumber;
    scanStatus: z.ZodEnum<{
        PENDING: "PENDING";
        CLEAN: "CLEAN";
        INFECTED: "INFECTED";
    }>;
    channelId: z.ZodNullable<z.ZodString>;
    createdAt: z.ZodISODateTime;
    downloadUrl: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type FileAsset = z.infer<typeof fileAssetSchema>;
//# sourceMappingURL=files.d.ts.map