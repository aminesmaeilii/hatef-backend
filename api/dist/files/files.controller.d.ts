import type { Request } from "express";
import type { FileAsset } from "@hatef/contracts";
import type { RequestActor } from "../session/actor.types";
import { FilesService } from "./files.service";
export declare class FilesController {
    private readonly files;
    constructor(files: FilesService);
    upload(channelId: string, file: Express.Multer.File | undefined, actor: RequestActor, req: Request): Promise<FileAsset>;
    list(channelId: string): Promise<FileAsset[]>;
    getOne(channelId: string, fileId: string, actor: RequestActor, req: Request): Promise<FileAsset>;
}
//# sourceMappingURL=files.controller.d.ts.map