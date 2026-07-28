export const ANTIVIRUS_SCANNER = Symbol("ANTIVIRUS_SCANNER");

export interface ScanResult {
  clean: boolean;
}

export interface AntivirusScanner {
  scan(buffer: Buffer): Promise<ScanResult>;
}
