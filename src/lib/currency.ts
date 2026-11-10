import Decimal from "decimal.js";

// JOD has 3 decimal places
const CURRENCY = process.env.NEXT_PUBLIC_DEFAULT_CURRENCY ?? "JOD";
const LOCALE_MAP: Record<string, string> = {
  JOD: "ar-JO",
  USD: "en-US",
  SAR: "ar-SA",
  AED: "ar-AE",
};

/**
 * Format a monetary amount in the configured currency.
 * Uses Decimal.js to avoid floating-point errors.
 */
export function formatCurrency(
  amount: number | string | Decimal,
  currency: string = CURRENCY,
  locale?: string
): string {
  const num = new Decimal(amount).toNumber();
  const loc = locale ?? LOCALE_MAP[currency] ?? "ar-JO";

  try {
    const formatted = new Intl.NumberFormat(loc, {
      style: "currency",
      currency,
      minimumFractionDigits: currency === "JOD" ? 3 : 2,
      maximumFractionDigits: currency === "JOD" ? 3 : 2,
    }).format(num);

    // If output contains "N" alone it means JOD is not supported — use fallback
    if (/^\s*N\s+/.test(formatted) || formatted.trim().startsWith("N ")) {
      throw new Error("unsupported");
    }
    return formatted;
  } catch {
    // Fallback: format manually with Arabic dinar symbol
    const symbol = currency === "JOD" ? "د.أ" : currency === "SAR" ? "ر.س" : currency === "AED" ? "د.إ" : currency;
    const decimals = currency === "JOD" ? 3 : 2;
    return `${num.toFixed(decimals)} ${symbol}`;
  }
}

/**
 * Add two monetary amounts safely using Decimal.js
 */
export function addMoney(a: number | string, b: number | string): Decimal {
  return new Decimal(a).plus(new Decimal(b));
}

/**
 * Multiply amount by rate (e.g., for tax calculation)
 */
export function calcTax(amount: number | string, taxRate: number | string): Decimal {
  return new Decimal(amount).times(new Decimal(taxRate).dividedBy(100));
}

/**
 * Calculate discount amount
 */
export function calcDiscount(
  amount: number | string,
  discount: number | string,
  type: "PERCENTAGE" | "FIXED" = "PERCENTAGE"
): Decimal {
  if (type === "FIXED") return new Decimal(discount);
  return new Decimal(amount).times(new Decimal(discount).dividedBy(100));
}

/**
 * Round to JOD precision (3 decimal places)
 */
export function toJOD(amount: number | string | Decimal): Decimal {
  return new Decimal(amount).toDecimalPlaces(3, Decimal.ROUND_HALF_UP);
}
