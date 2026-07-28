"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JALALI_MONTH_NAMES = void 0;
exports.getJalaliMonthLength = getJalaliMonthLength;
exports.toJalali = toJalali;
exports.fromJalali = fromJalali;
exports.formatJalali = formatJalali;
const jalaali_js_1 = require("jalaali-js");
exports.JALALI_MONTH_NAMES = [
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
function getJalaliMonthLength(jy, jm) {
    return (0, jalaali_js_1.jalaaliMonthLength)(jy, jm);
}
/** Converts a UTC instant (the only thing ever persisted) to its Jalali calendar date in Asia/Tehran. */
function toJalali(date) {
    const tehran = toTehranWallClock(date);
    const { jy, jm, jd } = (0, jalaali_js_1.toJalaali)(tehran.getUTCFullYear(), tehran.getUTCMonth() + 1, tehran.getUTCDate());
    return { jy, jm, jd };
}
/** Converts a Jalali calendar date (as displayed/entered in Asia/Tehran) back to a UTC instant at local midnight. */
function fromJalali(jalaliDate) {
    const { gy, gm, gd } = (0, jalaali_js_1.toGregorian)(jalaliDate.jy, jalaliDate.jm, jalaliDate.jd);
    return fromTehranWallClock(new Date(Date.UTC(gy, gm - 1, gd)));
}
function formatJalali(date, separator = "/") {
    const { jy, jm, jd } = toJalali(date);
    const pad = (n) => String(n).padStart(2, "0");
    return `${jy}${separator}${pad(jm)}${separator}${pad(jd)}`;
}
const TEHRAN_OFFSET_MINUTES = 210; // Asia/Tehran is UTC+03:30 year-round (no DST since 2022).
function toTehranWallClock(utcDate) {
    return new Date(utcDate.getTime() + TEHRAN_OFFSET_MINUTES * 60_000);
}
function fromTehranWallClock(tehranWallClockAsUtc) {
    return new Date(tehranWallClockAsUtc.getTime() - TEHRAN_OFFSET_MINUTES * 60_000);
}
