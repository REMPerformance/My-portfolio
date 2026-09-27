import { NextResponse } from "next/server";
import { mailConfigured } from "@/lib/mail";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({ configured: mailConfigured() });
}
