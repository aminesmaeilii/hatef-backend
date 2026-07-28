import { z } from "zod";

export const fileAssetSchema = z.object({
  id: z.string(),
  originalName: z.string(),
  mimeType: z.string(),
  sizeBytes: z.number().int().nonnegative(),
  scanStatus: z.enum(["PENDING", "CLEAN", "INFECTED"]),
  channelId: z.string().nullable(),
  createdAt: z.iso.datetime(),
  downloadUrl: z.string().optional(),
});
export type FileAsset = z.infer<typeof fileAssetSchema>;
