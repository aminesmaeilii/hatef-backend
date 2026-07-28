import pino, { type Logger, type LoggerOptions } from "pino";
export interface CreateLoggerOptions {
    serviceName: string;
    level?: LoggerOptions["level"];
    pretty?: boolean;
}
/** `destination` is test-only — lets logger.test.ts capture output without a transport/file descriptor. */
export declare function createLogger(options: CreateLoggerOptions, destination?: pino.DestinationStream): Logger;
export type { Logger };
//# sourceMappingURL=logger.d.ts.map