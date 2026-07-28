import { Module } from "@nestjs/common";
import { SessionModule } from "../session/session.module";
import { RbacModule } from "../rbac/rbac.module";
import { AuditModule } from "../audit/audit.module";
import { AppConfigService } from "../config/app-config.service";
import { ANTIVIRUS_SCANNER } from "./antivirus-scanner.interface";
import { DevAntivirusProvider } from "./dev-antivirus.provider";
import { LiveAntivirusProvider } from "./live-antivirus.provider";
import { StorageService } from "./storage.service";
import { FilesService } from "./files.service";
import { FilesController } from "./files.controller";

@Module({
  imports: [SessionModule, RbacModule, AuditModule],
  controllers: [FilesController],
  providers: [
    StorageService,
    DevAntivirusProvider,
    LiveAntivirusProvider,
    {
      provide: ANTIVIRUS_SCANNER,
      useFactory: (config: AppConfigService, dev: DevAntivirusProvider, live: LiveAntivirusProvider) =>
        config.env.ANTIVIRUS_PROVIDER === "live" ? live : dev,
      inject: [AppConfigService, DevAntivirusProvider, LiveAntivirusProvider],
    },
    FilesService,
  ],
  exports: [FilesService],
})
export class FilesModule {}
