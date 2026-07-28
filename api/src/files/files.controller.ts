import { BadRequestException, Controller, Get, Param, Post, Req, UploadedFile, UseGuards, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { memoryStorage } from "multer";
import type { Request } from "express";
import type { FileAsset } from "@hatef/contracts";
import { PERMISSIONS } from "@hatef/auth";
import { SessionAuthGuard } from "../session/session-auth.guard";
import { PermissionGuard } from "../rbac/permission.guard";
import { RequirePermission } from "../rbac/require-permission.decorator";
import { CurrentActor } from "../session/current-actor.decorator";
import type { RequestActor } from "../session/actor.types";
import { FilesService } from "./files.service";

// Hard backstop above the configurable MAX_UPLOAD_SIZE_MB (default 25MB) —
// FilesService enforces the real, configured limit with a proper error;
// this just bounds how much multer will ever buffer into memory.
const MULTER_HARD_LIMIT_BYTES = 50 * 1024 * 1024;

@Controller("channels/:channelId/files")
@UseGuards(SessionAuthGuard, PermissionGuard)
export class FilesController {
  constructor(private readonly files: FilesService) {}

  @Post()
  @RequirePermission(PERMISSIONS.FILE_UPLOAD, { resourceType: "channel", resourceIdParam: "channelId" })
  @UseInterceptors(FileInterceptor("file", { storage: memoryStorage(), limits: { fileSize: MULTER_HARD_LIMIT_BYTES } }))
  async upload(
    @Param("channelId") channelId: string,
    @UploadedFile() file: Express.Multer.File | undefined,
    @CurrentActor() actor: RequestActor,
    @Req() req: Request,
  ): Promise<FileAsset> {
    if (!file) {
      throw new BadRequestException("فایلی ارسال نشده است.");
    }
    return this.files.upload(channelId, file, actor, req.ip);
  }

  @Get()
  @RequirePermission(PERMISSIONS.FILE_READ, { resourceType: "channel", resourceIdParam: "channelId" })
  async list(@Param("channelId") channelId: string): Promise<FileAsset[]> {
    return this.files.list(channelId);
  }

  @Get(":fileId")
  @RequirePermission(PERMISSIONS.FILE_READ, { resourceType: "channel", resourceIdParam: "channelId" })
  async getOne(
    @Param("channelId") channelId: string,
    @Param("fileId") fileId: string,
    @CurrentActor() actor: RequestActor,
    @Req() req: Request,
  ): Promise<FileAsset> {
    return this.files.getWithDownloadUrl(channelId, fileId, actor, req.ip);
  }
}
