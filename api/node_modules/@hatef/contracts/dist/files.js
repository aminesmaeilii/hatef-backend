"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fileAssetSchema = void 0;
const zod_1 = require("zod");
exports.fileAssetSchema = zod_1.z.object({
    id: zod_1.z.string(),
    originalName: zod_1.z.string(),
    mimeType: zod_1.z.string(),
    sizeBytes: zod_1.z.number().int().nonnegative(),
    scanStatus: zod_1.z.enum(["PENDING", "CLEAN", "INFECTED"]),
    channelId: zod_1.z.string().nullable(),
    createdAt: zod_1.z.iso.datetime(),
    downloadUrl: zod_1.z.string().optional(),
});
