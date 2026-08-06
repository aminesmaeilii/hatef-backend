import { Injectable } from "@nestjs/common";
import type { AntivirusScanner, ScanResult } from "./antivirus-scanner.interface";

/**
 * Production placeholder until a real malware-scanning vendor is selected.
 * Uploads still go through size and magic-byte validation.
 */
@Injectable()
export class LiveAntivirusProvider implements AntivirusScanner {
  async scan(_buffer: Buffer): Promise<ScanResult> {
    return { clean: true };
  }
}
