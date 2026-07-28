import { rial, subtractRial, multiplyRial, type RialAmount } from "./money";

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
export function calculatePinPrice(input: PinPriceInput): PinPriceResult {
  if (!Number.isInteger(input.requestedUniqueViews) || input.requestedUniqueViews < 0) {
    throw new TypeError(`requestedUniqueViews must be a non-negative integer, received ${input.requestedUniqueViews}`);
  }
  if (input.ratePerViewRial < 0n) {
    throw new RangeError("ratePerViewRial cannot be negative.");
  }

  const baseAmountRial = multiplyRial(input.ratePerViewRial, input.requestedUniqueViews);

  const discountRial = input.discountRial ?? rial(0);
  if (discountRial < 0n) {
    throw new RangeError("discountRial cannot be negative.");
  }
  if (discountRial > baseAmountRial) {
    throw new RangeError("discountRial cannot exceed the base amount.");
  }
  const afterDiscountRial = subtractRial(baseAmountRial, discountRial);

  const multiplierPercent = input.multiplierPercent ?? 100;
  if (!Number.isInteger(multiplierPercent) || multiplierPercent < 0) {
    throw new TypeError(`multiplierPercent must be a non-negative integer, received ${multiplierPercent}`);
  }
  let finalAmountRial = (afterDiscountRial * BigInt(multiplierPercent)) / 100n;

  if (input.minAmountRial !== undefined && finalAmountRial < input.minAmountRial) {
    finalAmountRial = input.minAmountRial;
  }
  if (input.capAmountRial !== undefined && finalAmountRial > input.capAmountRial) {
    finalAmountRial = input.capAmountRial;
  }

  const lineItems: PinPriceLineItem[] = [
    { label: "مبلغ پایه (نرخ در تعداد بازدید یکتا)", amountRial: baseAmountRial },
  ];
  if (discountRial > 0n) {
    lineItems.push({ label: "تخفیف", amountRial: -discountRial });
  }
  if (multiplierPercent !== 100) {
    lineItems.push({ label: `اعمال ضریب (${multiplierPercent}%)`, amountRial: finalAmountRial - afterDiscountRial });
  }
  lineItems.push({ label: "مبلغ نهایی", amountRial: finalAmountRial });

  return { baseAmountRial, discountRial, afterDiscountRial, multiplierPercent, finalAmountRial, lineItems };
}
