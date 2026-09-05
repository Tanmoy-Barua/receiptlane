import { NextResponse } from "next/server";
import { getUscisMode } from "@/lib/uscis-client";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "uscis-case-tracker",
    mode: getUscisMode(),
    time: new Date().toISOString(),
  });
}
