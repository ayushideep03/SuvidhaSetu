import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, getClientIp } from "@/lib/server/rate-limit";

const BACKEND_URL = (
  process.env.BACKEND_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:8000"
).replace(/\/$/, "");

async function proxyRequest(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const upstreamUrl = new URL(path.join("/"), `${BACKEND_URL}/`);
  upstreamUrl.search = request.nextUrl.search;

  const method = request.method.toUpperCase();
  const ip = getClientIp(request.headers);
  const isPost = method === "POST";
  const rateLimit = checkRateLimit({
    key: `backend:${ip}:${method}:${path.join("/")}`,
    limit: isPost ? 20 : 120,
    windowMs: 60_000,
  });

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please slow down and try again shortly." },
      {
        status: 429,
        headers: { "Retry-After": String(rateLimit.retryAfter) },
      }
    );
  }

  const hasBody = method !== "GET" && method !== "HEAD";
  const contentLength = Number(request.headers.get("Content-Length") ?? 0);
  if (contentLength > 64 * 1024) {
    return NextResponse.json(
      { error: "Request body too large." },
      { status: 413 }
    );
  }

  let upstream: Response;
  try {
    upstream = await fetch(upstreamUrl, {
      method,
      headers: {
        "Content-Type": request.headers.get("Content-Type") ?? "application/json",
      },
      body: hasBody ? await request.text() : undefined,
      cache: "no-store",
    });
  } catch {
    return NextResponse.json(
      { error: "Backend API is unreachable" },
      { status: 502 }
    );
  }

  const contentType = upstream.headers.get("Content-Type") ?? "application/json";
  const body = await upstream.text();

  return new NextResponse(body, {
    status: upstream.status,
    headers: {
      "Content-Type": contentType,
    },
  });
}

export const GET = proxyRequest;
export const POST = proxyRequest;
