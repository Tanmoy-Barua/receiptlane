import { NextRequest, NextResponse } from "next/server";
import { getUscisMode, lookupCaseStatus } from "@/lib/uscis-client";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const receipt = request.nextUrl.searchParams.get("receipt") ?? "";
  const result = await lookupCaseStatus(receipt);

  if (!result.ok) {
    const status =
      result.code === "INVALID_FORMAT"
        ? 422
        : result.code === "NOT_FOUND"
          ? 404
          : result.code === "UNAUTHORIZED"
            ? 401
            : result.code === "RATE_LIMIT"
              ? 429
              : 502;
    return NextResponse.json(result, { status });
  }

  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  let body: { receipt?: string } = {};
  try {
    body = (await request.json()) as { receipt?: string };
  } catch {
    return NextResponse.json(
      { ok: false, code: "INVALID_FORMAT", error: "Expected JSON body with receipt." },
      { status: 400 }
    );
  }

  const result = await lookupCaseStatus(body.receipt ?? "");
  if (!result.ok) {
    const status =
      result.code === "INVALID_FORMAT"
        ? 422
        : result.code === "NOT_FOUND"
          ? 404
          : result.code === "UNAUTHORIZED"
            ? 401
            : result.code === "RATE_LIMIT"
              ? 429
              : 502;
    return NextResponse.json(result, { status });
  }
  return NextResponse.json(result);
}

export async function HEAD() {
  return NextResponse.json({ mode: getUscisMode() });
}
