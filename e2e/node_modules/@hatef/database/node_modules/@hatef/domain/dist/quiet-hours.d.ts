export interface QuietHoursWindow {
    startHour: number;
    endHour: number;
}
/**
 * Whether `hour` (0-23, already resolved to the user's local time by the
 * caller) falls inside a quiet-hours window. Windows may wrap past
 * midnight (e.g. 22 -> 7): `startHour > endHour` is treated as "from
 * startHour through 23, and from 0 through endHour", not an empty range.
 * `startHour === endHour` means the window covers the entire day (spec 19
 * "quiet hours" — a user who sets identical start/end wants everything
 * deferred, not nothing).
 */
export declare function isWithinQuietHours(hour: number, window: QuietHoursWindow): boolean;
//# sourceMappingURL=quiet-hours.d.ts.map