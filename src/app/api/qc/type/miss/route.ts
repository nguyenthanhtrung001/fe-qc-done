import { NextResponse } from "next/server";
import { getMissRecords } from "@/lib/qcMissStore";

export async function GET() {
  return NextResponse.json(
    {
      success: true,
      result: getMissRecords(),
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}