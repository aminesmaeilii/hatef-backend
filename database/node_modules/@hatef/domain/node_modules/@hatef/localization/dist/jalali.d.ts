export declare const JALALI_MONTH_NAMES: string[];
/** Number of days in a Jalali month (29-31, or 30 for Esfand in a leap year). */
export declare function getJalaliMonthLength(jy: number, jm: number): number;
export interface JalaliDate {
    jy: number;
    jm: number;
    jd: number;
}
/** Converts a UTC instant (the only thing ever persisted) to its Jalali calendar date in Asia/Tehran. */
export declare function toJalali(date: Date): JalaliDate;
/** Converts a Jalali calendar date (as displayed/entered in Asia/Tehran) back to a UTC instant at local midnight. */
export declare function fromJalali(jalaliDate: JalaliDate): Date;
export declare function formatJalali(date: Date, separator?: string): string;
//# sourceMappingURL=jalali.d.ts.map