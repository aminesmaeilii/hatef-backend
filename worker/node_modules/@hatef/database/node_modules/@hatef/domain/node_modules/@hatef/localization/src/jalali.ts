import { toJalaali, toGregorian, jalaaliMonthLength } from "jalaali-js";

export const JALALI_MONTH_NAMES = [
  "فروردین",
  "اردیبهشت",
  "خرداد",
  "تیر",
  "مرداد",
  "شهریور",
  "مهر",
  "آبان",
  "آذر",
  "دی",
  "بهمن",
  "اسفند",
];

/** Number of days in a Jalali month (29-31, or 30 for Esfand in a leap year). */
export function getJalaliMonthLength(jy: number, jm: number): number {
  return jalaaliMonthLength(jy, jm);
}

export interface JalaliDate {
  jy: number;
  jm: number;
  jd: number;
}

/** Converts a UTC instant (the only thing ever persisted) to its Jalali calendar date in Asia/Tehran. */
export function toJalali(date: Date): JalaliDate {
  const tehran = toTehranWallClock(date);
  const { jy, jm, jd } = toJalaali(tehran.getUTCFullYear(), tehran.getUTCMonth() + 1, tehran.getUTCDate());
  return { jy, jm, jd };
}

/** Converts a Jalali calendar date (as displayed/entered in Asia/Tehran) back to a UTC instant at local midnight. */
export function fromJalali(jalaliDate: JalaliDate): Date {
  const { gy, gm, gd } = toGregorian(jalaliDate.jy, jalaliDate.jm, jalaliDate.jd);
  return fromTehranWallClock(new Date(Date.UTC(gy, gm - 1, gd)));
}

export function formatJalali(date: Date, separator = "/"): string {
  const { jy, jm, jd } = toJalali(date);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${jy}${separator}${pad(jm)}${separator}${pad(jd)}`;
}

const TEHRAN_OFFSET_MINUTES = 210; // Asia/Tehran is UTC+03:30 year-round (no DST since 2022).

function toTehranWallClock(utcDate: Date): Date {
  return new Date(utcDate.getTime() + TEHRAN_OFFSET_MINUTES * 60_000);
}

function fromTehranWallClock(tehranWallClockAsUtc: Date): Date {
  return new Date(tehranWallClockAsUtc.getTime() - TEHRAN_OFFSET_MINUTES * 60_000);
}
