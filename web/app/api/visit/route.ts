import { NextResponse } from "next/server";
import { checkRateLimit, getClientIp } from "@/lib/server/rate-limit";

export const runtime = "edge";

type VisitResponse = {
  count: number | null;
  configured: boolean;
  error?: string;
};

function redisConfig() {
  const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!upstashUrl || !upstashToken) {
    return null;
  }

  return { upstashUrl, upstashToken };
}

async function redisCommand<T>(command: string): Promise<T> {
  const config = redisConfig();
  if (!config) {
    throw new Error("Visitor counter storage is not configured.");
  }

  const res = await fetch(`${config.upstashUrl}/${command}`, {
    headers: { Authorization: `Bearer ${config.upstashToken}` },
    method: "GET",
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Visitor counter storage returned ${res.status}.`);
  }

  const data = (await res.json()) as { result: T };
  return data.result;
}

export async function GET(request: Request) {
  const ip = getClientIp(request.headers);
  const rateLimit = checkRateLimit({
    key: `visit:get:${ip}`,
    limit: 120,
    windowMs: 60_000,
  });

  if (!rateLimit.allowed) {
    return NextResponse.json<VisitResponse>(
      { count: null, configured: true, error: "Too many requests." },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfter) } }
    );
  }

  try {
    const result = await redisCommand<string | number | null>("get/visit_count");
    const count = result === null ? 0 : Number(result);
    return NextResponse.json<VisitResponse>({ count, configured: true });
  } catch (error) {
    return NextResponse.json<VisitResponse>(
      {
        count: null,
        configured: false,
        error: error instanceof Error ? error.message : "Visitor counter unavailable.",
      },
      { status: 503 }
    );
  }
}

export async function POST(request: Request) {
  const ip = getClientIp(request.headers);
  const rateLimit = checkRateLimit({
    key: `visit:post:${ip}`,
    limit: 12,
    windowMs: 60_000,
  });

  if (!rateLimit.allowed) {
    return NextResponse.json<VisitResponse>(
      { count: null, configured: true, error: "Too many requests." },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfter) } }
    );
  }

  try {
    const count = await redisCommand<number>("incr/visit_count");
    return NextResponse.json<VisitResponse>({ count, configured: true });
  } catch (error) {
    return NextResponse.json<VisitResponse>(
      {
        count: null,
        configured: false,
        error: error instanceof Error ? error.message : "Visitor counter unavailable.",
      },
      { status: 503 }
    );
  }
}
