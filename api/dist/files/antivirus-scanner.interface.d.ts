export declare const ANTIVIRUS_SCANNER: unique symbol;
export interface ScanResult {
    clean: boolean;
}
export interface AntivirusScanner {
    scan(buffer: Buffer): Promise<ScanResult>;
}
//# sourceMappingURL=antivirus-scanner.interface.d.ts.map