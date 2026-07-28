import { type RialAmount } from "./money";
export interface PinPriceLineItem {
    label: string;
    amountRial: RialAmount;
}
export interface PinPriceInput {
    requestedUniqueViews: number;
    ratePerViewRial: RialAmount;
    discountRial?: RialAmount;
    /** Integer percent, 100 = unchanged. Applied by integer bigint division, never float. */
    multiplierPercent?: number;
    minAmountRial?: RialAmount;
    capAmountRial?: RialAmount;
}
export interface PinPriceResult {
    baseAmountRial: RialAmount;
    discountRial: RialAmount;
    afterDiscountRial: RialAmount;
    multiplierPercent: number;
    finalAmountRial: RialAmount;
    lineItems: PinPriceLineItem[];
}
/**
 * The authoritative first-position pin pricing formula (spec 13.1):
 * estimated_cost_rial = requested_unique_views * snapshotted_rate_per_unique_view_rial,
 * then an optional discount, an optional multiplier, and an optional
 * min/cap clamp — all integer bigint arithmetic, never float. Pure and
 * deterministic so a stored input snapshot always reproduces the same
 * output, satisfying "reproducible input snapshot" (spec 21.1).
 */
export declare function calculatePinPrice(input: PinPriceInput): PinPriceResult;
//# sourceMappingURL=pricing.d.ts.map