import { formatInTimeZone } from "date-fns-tz";
import { format, parseISO, isValid } from "date-fns";
import { ar, enUS } from "date-fns/locale";

const DEFAULT_TZ = process.env.DEFAULT_TIMEZONE ?? "Asia/Amman";

/**
 * Format a date in the configured timezone
 */
export function formatDate(
  date: Date | string,
  fmt: string = "dd/MM/yyyy",
  locale: "ar" | "en" = "ar",
  tz: string = DEFAULT_TZ
): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  if (!isValid(d)) return "—";
  return formatInTimeZone(d, tz, fmt, {
    locale: locale === "ar" ? ar : enUS,
  });
}

/**
 * Format a date with time
 */
export function formatDateTime(
  date: Date | string,
  locale: "ar" | "en" = "ar",
  tz: string = DEFAULT_TZ
): string {
  return formatDate(date, "dd/MM/yyyy HH:mm", locale, tz);
}

/**
 * Get current date/time in configured timezone
 */
export function nowInTZ(tz: string = DEFAULT_TZ): Date {
  return new Date(
    new Date().toLocaleString("en-US", { timeZone: tz })
  );
}

/**
 * Get start of today in the configured timezone
 */
export function startOfTodayTZ(tz: string = DEFAULT_TZ): Date {
  const now = new Date();
  const tzDate = new Date(now.toLocaleString("en-US", { timeZone: tz }));
  tzDate.setHours(0, 0, 0, 0);
  return tzDate;
}

/**
 * Get end of today in the configured timezone
 */
export function endOfTodayTZ(tz: string = DEFAULT_TZ): Date {
  const now = new Date();
  const tzDate = new Date(now.toLocaleString("en-US", { timeZone: tz }));
  tzDate.setHours(23, 59, 59, 999);
  return tzDate;
}

/**
 * Generate a document number with prefix and date
 * Example: INV-20241013-0001
 */
export function generateDocNumber(prefix: string, sequence: number): string {
  const date = formatDate(new Date(), "yyyyMMdd", "en");
  return `${prefix}-${date}-${String(sequence).padStart(4, "0")}`;
}
