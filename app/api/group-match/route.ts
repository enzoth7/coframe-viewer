import { NextResponse } from "next/server";

type GroupMatchPayload = {
  action?: string;
  brandIds?: string[];
  pairIndex?: number;
  value?: string;
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as GroupMatchPayload | null;

  if (!body) {
    return NextResponse.json(
      {
        error: true,
        message: "Body inválido.",
      },
      { status: 400 },
    );
  }

  const endpoint = process.env.NEXT_PUBLIC_APPSCRIPT_URL;
  if (!endpoint) {
    return NextResponse.json(
      {
        error: true,
        message: "Falta configurar NEXT_PUBLIC_APPSCRIPT_URL.",
      },
      { status: 500 },
    );
  }

  const forwardRequest = async (payload: GroupMatchPayload) => {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok || (data as { error?: boolean })?.error) {
      const message =
        (data as { message?: string; error?: string })?.message ??
        (data as { message?: string; error?: string })?.error ??
        "El Apps Script devolvió un error.";
      return NextResponse.json(
        {
          error: true,
          message,
        },
        { status: 500 },
      );
    }

    return NextResponse.json(data ?? { ok: true }, { status: 200 });
  };

  if (body.action === "updateContradiccionCultural") {
    return forwardRequest(body);
  }

  const brandIds = Array.isArray(body.brandIds) ? body.brandIds : [];

  if (!brandIds.length) {
    return NextResponse.json(
      {
        error: true,
        message: "Debes enviar al menos un brandId.",
      },
      { status: 400 },
    );
  }

  return forwardRequest({ brandIds });
}
