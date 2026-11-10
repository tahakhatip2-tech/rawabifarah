import { NextRequest, NextResponse } from "next/server";

// Simple in-memory rate limiter (use Redis in production)
const ipRequestMap = new Map<string, { count: number; resetAt: number }>();

const MAX = parseInt(process.env.RATE_LIMIT_MAX ?? "100");
const WINDOW = parseInt(process.env.RATE_LIMIT_WINDOW_MS ?? "60000");

export function rateLimit(req: NextRequest): NextResponse | null {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const now = Date.now();
  const entry = ipRequestMap.get(ip);

  if (!entry || now > entry.resetAt) {
    ipRequestMap.set(ip, { count: 1, resetAt: now + WINDOW });
    return null;
  }

  entry.count++;
  if (entry.count > MAX) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429, headers: { "Retry-After": String(Math.ceil((entry.resetAt - now) / 1000)) } }
    );
  }

  return null;
}
