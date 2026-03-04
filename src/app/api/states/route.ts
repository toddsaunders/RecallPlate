import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ message: "States API — not yet implemented" }, { status: 501 });
}
