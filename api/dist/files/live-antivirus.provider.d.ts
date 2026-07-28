import type { AntivirusScanner, ScanResult } from "./antivirus-scanner.interface";
/**
 * Production adapter interface. No real malware-scanning engine/credential
 * exists yet — wire a real vendor (ClamAV daemon, a cloud scanning API,
 * ...) here when one is selected. Fails closed (never reports clean) rather
 * than silently behaving like the dev provider.
 */
export declare class LiveAntivirusProvider implements AntivirusScanner {
    scan(_buffer: Buffer): Promise<ScanResult>;
}
//# sourceMappingURL=live-antivirus.provider.d.ts.map