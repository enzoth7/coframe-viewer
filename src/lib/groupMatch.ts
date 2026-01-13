"use client";

export type ContradiccionValue = "Ninguna" | "Parcial" | "Alta";

const GROUP_MATCH_ENDPOINT = "/api/group-match";

export async function updateContradiccionCultural(
  pairIndex: number,
  value: ContradiccionValue,
) {
  try {
    const response = await fetch(GROUP_MATCH_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "updateContradiccionCultural",
        pairIndex,
        value,
      }),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok || data?.error) {
      const message =
        (data as { message?: string; error?: string })?.message ??
        (data as { message?: string; error?: string })?.error ??
        "No se pudo actualizar la contradicción cultural.";
      throw new Error(message);
    }

    return true;
  } catch (error) {
    console.error("updateContradiccionCultural failed:", error);
    throw error;
  }
}
