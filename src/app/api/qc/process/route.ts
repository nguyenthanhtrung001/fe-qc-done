import { NextResponse } from "next/server";
import { processQC } from "@/services/qcProcessor";
import { addMissRecord } from "@/lib/qcMissStore";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const qcCode = String(body?.qcCode ?? "").trim();

    if (!qcCode) {
      return NextResponse.json(
        {
          success: false,
          message: "qcCode is required",
        },
        { status: 400 },
      );
    }

    const result = await processQC(qcCode);

    if (result.updateStatus === "miss") {
      addMissRecord({
        ...result,
        checkedAt: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error) {
    console.error("/api/qc/process failed", error);

    const message = error instanceof Error ? error.message : "Failed to process QC";

    return NextResponse.json(
      {
        success: false,
        message,
      },
      { status: 500 },
    );
  }
}