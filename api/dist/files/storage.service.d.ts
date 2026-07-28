import { OnModuleInit } from "@nestjs/common";
import { AppConfigService } from "../config/app-config.service";
export declare class StorageService implements OnModuleInit {
    private readonly config;
    private readonly logger;
    private readonly client;
    constructor(config: AppConfigService);
    onModuleInit(): Promise<void>;
    putObject(key: string, body: Buffer, contentType: string): Promise<void>;
    getSignedDownloadUrl(key: string): Promise<string>;
}
//# sourceMappingURL=storage.service.d.ts.map