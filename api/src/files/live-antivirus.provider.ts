import { Injectable } from "@nestjs/common";
import type { AntivirusScanner, ScanResult } from "./antivirus-scanner.interface";

/**
 * Production adapter interface. No real malware-scanning engine/credential
 * exists yet — wire a real vendor (ClamAV daemon, a cloud scanning API,
 * ...) here when one is selected. Fails closed (never reports clean) rather
 * than silently behaving like the dev provider.
 */
@Injectable()
export class LiveAntivirusProvider implements AntivirusScanner {
  async scan(_buffer: Buffer): Promise<ScanResult> {
    throw new Error("Live antivirus scanning is not configured. Set ANTIVIRUS_PROVIDER=dev until a vendor is wired up.");
  }
}
