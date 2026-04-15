import { NextResponse } from "next/server";

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const qcCode = String(body?.qcCode ?? "").trim();
    const type = String(body?.type ?? "").trim();

    if (!qcCode || !type) {
      return NextResponse.json(
        {
          success: false,
          message: "qcCode and type are required",
        },
        { status: 400 },
      );
    }

    console.log("/api/qc/update-type:", { qcCode, type });

    return NextResponse.json({
      success: true,
      data: {
        qcCode,
        type,
      },
    });
  } catch (error) {
    console.error("/api/qc/update-type failed", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update QC type",
      },
      { status: 500 },
    );
  }
}