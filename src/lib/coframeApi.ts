import { brands as fallbackBrands } from "@/data/brands";

export type Brand = {
  id: string;
  name: string;
  color?: string;
  score?: number;
};

type LegacyRow = Record<string, unknown>;

type SheetResponse = {
  sheet?: string;
  brands?: Brand[];
  rows?: LegacyRow[];
};

const normalizeString = (value: unknown) =>
  typeof value === "string" ? value.trim() : "";

const mapLegacyRowsToBrands = (rows: LegacyRow[]): Brand[] =>
  rows
    .map((row, index) => {
      const fallback = `Marca ${index + 1}`;
      const nameCandidate =
        normalizeString(row["NOMBRE_MARCA"] || row["Nombre"] || row["Marca"] || row["NAME"]) || "";

      if (!nameCandidate || nameCandidate.toUpperCase() === "NOMBRE_MARCA") {
        return null;
      }

      const idCandidate =
        normalizeString(row["ID_MARCA"]) ||
        normalizeString(row["ID"]) ||
        nameCandidate.toLowerCase().replace(/\s+/g, "-") ||
        fallback;

      return { id: idCandidate, name: nameCandidate };
    })
    .filter((brand): brand is Brand => Boolean(brand));

export async function fetchBrands(): Promise<Brand[]> {
  const url = process.env.NEXT_PUBLIC_COFRA_SHEETS_URL;
  if (!url) {
    console.warn("NEXT_PUBLIC_COFRA_SHEETS_URL no está definida. Usando marcas locales.");
    return fallbackBrands;
  }

  try {
    let targetUrl = url;
    if (url.includes("docs.google.com/spreadsheets/d/")) {
      const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
      const gidMatch = url.match(/gid=([0-9]+)/);
      if (match) {
        const sheetId = match[1];
        const gid = gidMatch ? gidMatch[1] : "0";
        targetUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&gid=${gid}`;
      }
    }

    const response = await fetch(targetUrl, { cache: "no-store" });
    if (response.ok) {
      const contentType = response.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const data = (await response.json()) as SheetResponse;

        if (Array.isArray(data?.brands) && data.brands.length) {
          return data.brands.map((brand) => ({
            id: brand.id,
            name: brand.name,
          }));
        }

        if (Array.isArray(data?.rows)) {
          const legacyBrands = mapLegacyRowsToBrands(data.rows);
          if (legacyBrands.length) {
            return legacyBrands;
          }
        }
      } else {
        const text = await response.text();
        const lines = text.split("\n").filter(Boolean);
        if (lines.length > 1) {
          const headers = lines[0].split(",").map((h) => h.replace(/^"|"$/g, "").trim());
          const rows: LegacyRow[] = lines.slice(1).map((line) => {
            const values = line.split(",").map((v) => v.replace(/^"|"$/g, "").trim());
            const obj: LegacyRow = {};
            headers.forEach((h, i) => {
              obj[h] = values[i];
            });
            return obj;
          });
          const parsed = mapLegacyRowsToBrands(rows);
          if (parsed.length) return parsed;
        }
      }
    }
  } catch (err) {
    console.warn("No se pudieron obtener marcas del endpoint remoto, usando marcas locales:", err);
  }

  return fallbackBrands;
}
