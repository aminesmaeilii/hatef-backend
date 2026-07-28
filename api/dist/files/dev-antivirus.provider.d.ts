import type { AntivirusScanner, ScanResult } from "./antivirus-scanner.interface";
/** Local-development stand-in — no real AV engine available; always reports clean. */
export declare class DevAntivirusProvider implements AntivirusScanner {
    scan(_buffer: Buffer): Promise<ScanResult>;
}
//# sourceMappingURL=dev-antivirus.provider.d.ts.map