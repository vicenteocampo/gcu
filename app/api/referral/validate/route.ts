import { NextResponse } from "next/server";
import { isValidInviteCode } from "@/lib/invite";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");

  return NextResponse.json({ valid: await isValidInviteCode(code) });
}
