import { Injectable } from "@nestjs/common";
import type { AntivirusScanner, ScanResult } from "./antivirus-scanner.interface";

/** Local-development stand-in — no real AV engine available; always reports clean. */
@Injectable()
export class DevAntivirusProvider implements AntivirusScanner {
  async scan(_buffer: Buffer): Promise<ScanResult> {
    return { clean: true };
  }
}
