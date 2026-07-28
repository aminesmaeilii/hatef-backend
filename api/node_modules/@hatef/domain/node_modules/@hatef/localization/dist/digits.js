"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toLatinDigits = toLatinDigits;
exports.toPersianDigits = toPersianDigits;
exports.formatRial = formatRial;
const PERSIAN_DIGITS = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
const ARABIC_INDIC_DIGITS = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
const LATIN_DIGITS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
/** Converts Persian and Arabic-Indic digits in a string to Latin digits. Leaves everything else untouched. */
function toLatinDigits(input) {
    return input.replace(/[۰-۹٠-٩]/g, (char) => {
        const persianIndex = PERSIAN_DIGITS.indexOf(char);
        if (persianIndex !== -1)
            return LATIN_DIGITS[persianIndex];
        const arabicIndex = ARABIC_INDIC_DIGITS.indexOf(char);
        if (arabicIndex !== -1)
            return LATIN_DIGITS[arabicIndex];
        return char;
    });
}
/** Converts Latin digits in a string to Persian digits, for display purposes only. */
function toPersianDigits(input) {
    return String(input).replace(/[0-9]/g, (char) => PERSIAN_DIGITS[Number(char)]);
}
/** Formats an integer rial amount with Persian digit grouping, e.g. 1234000 -> "۱٬۲۳۴٬۰۰۰". */
function formatRial(amountRial) {
    const grouped = amountRial.toLocaleString("en-US");
    return toPersianDigits(grouped).replace(/,/g, "٬");
}
